"""Scout API: harvest question-shaped material for editorial research.

Synthesis (turning MATERIAL into topic cards via the AI waterfall) is
deliberately NOT built yet: the editorial prompt is mid-validation with a real
writer. Until that two-week gate passes, Scout harvests and hands the writer a
paste-ready block for whatever model they trust."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.providers import registry
from app.providers.base import ProviderError
from app.services.scout import reddit, suggest

logger = logging.getLogger("quietshelf.scout")

router = APIRouter(prefix="/api/scout", tags=["scout"])

# Synthesis is bring-your-own-prompt: the writer's editorial prompt lives in a
# textbox (and their browser), never in this codebase. One waterfall call,
# plain text out. Caps keep a single request from eating the day's quota.
SYNTH_MATERIAL_CAP = 6000   # words of material sent to the model
SYNTH_PROMPT_CAP = 2500     # words of prompt


class HarvestRequest(BaseModel):
    sources: list[str] = Field(default_factory=list, max_length=reddit.MAX_SOURCES)
    seeds: list[str] = Field(default_factory=list, max_length=suggest.MAX_SEEDS)


class SynthesizeRequest(BaseModel):
    material: str = Field(..., min_length=40)
    prompt: str = Field(..., min_length=20)


def _cap_words(text: str, cap: int) -> tuple[str, bool]:
    words = text.split()
    if len(words) <= cap:
        return text, False
    return " ".join(words[:cap]) + "\n\n[material truncated for length]", True


@router.post("/harvest")
def harvest(req: HarvestRequest):
    if not req.sources and not req.seeds:
        raise HTTPException(status_code=422, detail="Give me at least one source or seed phrase.")
    result = {"material": "", "word_count": 0, "post_count": 0,
              "sources": [], "errors": [], "snapshot": None}
    if req.sources:
        try:
            result = reddit.harvest(req.sources)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception as exc:  # noqa: BLE001
            logger.exception("scout harvest error")
            raise HTTPException(status_code=502, detail=f"Harvest failed: {exc.__class__.__name__}")
    sugg = {"section": "", "count": 0, "errors": []}
    if req.seeds:
        try:
            sugg = suggest.gather(req.seeds)
        except Exception:  # noqa: BLE001
            logger.exception("scout suggest error")
    if sugg["section"]:
        result["material"] = sugg["section"] + "\n\n---\n\n" + result["material"]
        result["word_count"] = len(result["material"].split())
    result["suggestion_count"] = sugg["count"]
    result["errors"] = result["errors"] + sugg["errors"]
    if result["post_count"] == 0 and sugg["count"] == 0:
        detail = "Nothing came back from those sources."
        if result["errors"]:
            detail += " Errors: " + "; ".join(result["errors"][:4])
        raise HTTPException(status_code=502, detail=detail)
    return result


@router.post("/synthesize")
def synthesize(req: SynthesizeRequest):
    prompt, prompt_cut = _cap_words(req.prompt.strip(), SYNTH_PROMPT_CAP)
    material, material_cut = _cap_words(req.material.strip(), SYNTH_MATERIAL_CAP)
    try:
        provider = registry.get_provider()
        text = provider.generate(prompt, "MATERIAL:\n\n" + material, json_mode=False)
    except ProviderError as exc:
        logger.warning("scout synthesize provider failure: %s", exc)
        raise HTTPException(status_code=502, detail=f"The AI providers are unavailable right now: {exc}")
    except Exception:  # noqa: BLE001
        logger.exception("scout synthesize error")
        raise HTTPException(status_code=502, detail="Synthesis failed unexpectedly.")
    if not (text or "").strip():
        raise HTTPException(status_code=502, detail="The model returned nothing - try again.")
    return {
        "result": text.strip(),
        "material_truncated": material_cut,
        "prompt_truncated": prompt_cut,
    }
