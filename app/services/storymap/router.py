"""Story Map endpoints.

POST /api/storymap/scan  - Pass 1, fast entity names for the live loader.
POST /api/storymap/map   - Pass 2, the full structured map.

Both accept pasted text or an uploaded DOCX/RTF/TXT and enforce the 3,000-word
v1 cap BEFORE any model call. The map endpoint never returns a bare 502 or a
swallowed exception on a read failure: a model response we can't parse becomes a
clean 500 with a body (and a server-side traceback), and a non-narrative or
empty-cast document comes back as an honest story_detected=false map, never a
fabricated one.
"""
from __future__ import annotations

import logging
import traceback
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app import config
from app.deps import guard
from app.http_errors import llm_error_to_response
from app.ingest import UnsupportedFormat, extract_text
from app.providers import JSONParseError, ProviderConfigError, ProviderError
from app.services.storymap.engine import (
    imagine_map,
    imagine_prompts,
    map_story,
    scan_entities,
)
from app.services.storymap.models import (
    CAP_MESSAGE,
    EntityScan,
    ImagineMode,
    StoryMap,
)

logger = logging.getLogger("quietshelf.storymap")

router = APIRouter(prefix="/api/storymap", tags=["storymap"])

MIN_WORDS = 10


async def _read_manuscript(text: str | None, file: UploadFile | None) -> str:
    """Resolve the manuscript from an upload or pasted text, validating size and
    type. Raises HTTPException for client-side problems."""
    if file is not None:
        raw = await file.read()
        max_bytes = config.max_upload_mb() * 1024 * 1024
        if len(raw) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File is larger than the {config.max_upload_mb()} MB limit.",
            )
        try:
            return extract_text(raw, Path(file.filename or "upload").suffix.lower())
        except UnsupportedFormat as exc:
            raise HTTPException(status_code=415, detail=str(exc))
    return text or ""


def _validate_caps(manuscript: str) -> int:
    """Enforce the empty / near-empty / too-long rules. Returns the word count."""
    words = len(manuscript.split())
    if words == 0:
        raise HTTPException(
            status_code=422,
            detail="No text to map. Paste your story or upload a file.",
        )
    if words < MIN_WORDS:
        raise HTTPException(
            status_code=422,
            detail="Need a bit more text to map - paste a few sentences of story.",
        )
    if words > config.MAX_WORDS:
        raise HTTPException(status_code=422, detail=CAP_MESSAGE)
    return words


def _validate_imagine_caps(manuscript: str) -> int:
    """Imagine is lenient on the low end - the whole point is to break a dead
    end - so it only needs *some* material, but still respects the 3k cap."""
    words = len(manuscript.split())
    if words == 0:
        raise HTTPException(
            status_code=422,
            detail="Give me a little material to imagine from - a few lines, notes, even a mood.",
        )
    if words > config.MAX_WORDS:
        raise HTTPException(status_code=422, detail=CAP_MESSAGE)
    return words


@router.post("/scan", response_model=EntityScan)
async def scan(
    request: Request,
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
    _: None = Depends(guard),
):
    manuscript = await _read_manuscript(text, file)
    words = _validate_caps(manuscript)
    logger.info("storymap_scan_request words=%d provider=%s", words, config.provider_name())
    try:
        return scan_entities(manuscript)
    except JSONParseError:
        # The loader is best-effort: a flaky scan degrades to no entities (the
        # UI just shows a generic message), it never blocks the real map.
        traceback.print_exc()
        return EntityScan()
    except (ProviderConfigError, ProviderError) as exc:
        return llm_error_to_response(
            exc,
            failure_code="scan_failed",
            failure_msg="Couldn't scan the story - try again.",
        )


@router.post("/map", response_model=StoryMap, response_model_exclude_none=True)
async def map_endpoint(
    request: Request,
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
    _: None = Depends(guard),
):
    manuscript = await _read_manuscript(text, file)
    words = _validate_caps(manuscript)
    logger.info("storymap_map_request words=%d provider=%s", words, config.provider_name())
    try:
        return map_story(manuscript)
    except JSONParseError:
        # Model output was unreadable even after repair+retry. Clean, honest
        # error with a body - never a bare 502, never a swallowed exception.
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "error": "unreadable_map",
                "message": "Couldn't read the story map — try again.",
            },
        )
    except (ProviderConfigError, ProviderError) as exc:
        return llm_error_to_response(
            exc,
            failure_code="map_failed",
            failure_msg="Couldn't read the story map — try again.",
        )


@router.post("/imagine")
async def imagine(
    request: Request,
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
    mode: ImagineMode = Form(ImagineMode.seed),
    nudge: str = Form(""),
    existing: str = Form(""),  # comma-separated names already on the map
    reroll: bool = Form(False),
    _: None = Depends(guard),
):
    """The opt-in fabrication door - no dead ends. The writer explicitly asks
    the engine to imagine, so this MAY invent; every result is stamped
    fabricated=true. Three modes: seed (starter cast), full (complete imagined
    map), prompts (generative questions, no invented people)."""
    manuscript = await _read_manuscript(text, file)
    words = _validate_imagine_caps(manuscript)
    logger.info(
        "storymap_imagine_request mode=%s words=%d reroll=%s provider=%s",
        mode.value, words, reroll, config.provider_name(),
    )
    existing_names = [n.strip() for n in existing.split(",") if n.strip()]
    try:
        if mode is ImagineMode.prompts:
            result = imagine_prompts(manuscript, nudge=nudge, reroll=reroll)
        else:
            result = imagine_map(
                manuscript, mode, nudge=nudge, existing=existing_names, reroll=reroll
            )
        # Serialize ourselves so the "with" alias is emitted and unsupported
        # texture fields are omitted, matching the /map endpoint.
        return JSONResponse(content=result.model_dump(by_alias=True, exclude_none=True))
    except JSONParseError:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "error": "imagine_failed",
                "message": "Couldn't imagine a story this time — try again.",
            },
        )
    except (ProviderConfigError, ProviderError) as exc:
        return llm_error_to_response(
            exc,
            failure_code="imagine_failed",
            failure_msg="Couldn't imagine a story this time — try again.",
        )
