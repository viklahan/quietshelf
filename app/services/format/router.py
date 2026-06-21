"""Format endpoints: POST /api/format (returns .epub), GET /api/format/themes."""
from __future__ import annotations

import logging
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

from app import config
from app.deps import guard
from app.services.format.converter import (
    EpubValidationError,
    UnsupportedFormat,
    convert_to_epub,
)
from app.services.format.models import Theme, ThemeInfo, ThemeList
from app.services.format.themes import THEMES, get_theme

logger = logging.getLogger("quietshelf.format")

router = APIRouter(prefix="/api/format", tags=["format"])


@router.get("/themes", response_model=ThemeList)
def list_themes() -> ThemeList:
    return ThemeList(
        themes=[
            ThemeInfo(id=spec.id, display_name=spec.display_name, description=spec.description)
            for spec in THEMES.values()
        ]
    )


def _safe_stem(title: str) -> str:
    keep = "".join(c if c.isalnum() or c in " -_" else "" for c in title).strip()
    return (keep or "book").replace(" ", "_")[:60]


def _cleanup(workdir: Path) -> None:
    shutil.rmtree(workdir, ignore_errors=True)


@router.post("")
async def format_manuscript(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    author: str = Form(...),
    theme: Theme = Form(...),
    cover_image: UploadFile | None = File(None),
    _: None = Depends(guard),
):
    get_theme(theme)  # validates enum membership

    raw = await file.read()
    max_bytes = config.max_upload_mb() * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File is larger than the {config.max_upload_mb()} MB limit.",
        )

    suffix = Path(file.filename or "upload").suffix.lower()
    workdir = Path(tempfile.mkdtemp(prefix="quietshelf_req_"))
    src = workdir / f"source{suffix}"
    src.write_bytes(raw)

    cover_bytes = await cover_image.read() if cover_image is not None else None
    out = workdir / f"{_safe_stem(title)}.epub"

    try:
        convert_to_epub(
            source=src, out_path=out, title=title, author=author,
            theme=theme, cover_image=cover_bytes,
        )
    except UnsupportedFormat as exc:
        _cleanup(workdir)
        return JSONResponse(status_code=415, content={"error": "unsupported_format", "message": str(exc)})
    except EpubValidationError:
        _cleanup(workdir)
        logger.error("epub_validation_failed theme=%s", theme.value)
        return JSONResponse(
            status_code=502,
            content={
                "error": "conversion_failed",
                "message": "We couldn't build a valid EPUB from that file. Try a DOCX export.",
            },
        )
    except Exception:
        # pandoc/Pillow/IO failures - clean up and stay friendly, never a raw trace.
        _cleanup(workdir)
        logger.exception("format_failed theme=%s", theme.value)
        return JSONResponse(
            status_code=502,
            content={
                "error": "conversion_failed",
                "message": "Something went wrong converting that file. Try a DOCX export.",
            },
        )

    logger.info("format_complete theme=%s size_bytes=%d", theme.value, out.stat().st_size)

    # Stream the file, then clean up the whole request workdir.
    return FileResponse(
        out,
        media_type="application/epub+zip",
        filename=out.name,
        background=BackgroundTask(_cleanup, workdir),
    )
