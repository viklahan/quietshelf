"""Promote endpoint: POST /api/promote."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app import config
from app.deps import guard
from app.http_errors import llm_error_to_response
from app.providers import JSONParseError, ProviderConfigError, ProviderError
from app.services.promote.mapper import map_script
from app.services.promote.models import PromoteRequest, ShotList

logger = logging.getLogger("quietshelf.promote")

router = APIRouter(prefix="/api", tags=["promote"])


@router.post("/promote", response_model=ShotList)
def promote(body: PromoteRequest, request: Request, _: None = Depends(guard)):
    word_count = len(body.script.split())
    if word_count == 0:
        raise HTTPException(status_code=422, detail="Script is empty. Paste your script text and try again.")
    if word_count < config.MIN_WORDS:
        raise HTTPException(
            status_code=422,
            detail=f"Script too short - needs at least {config.MIN_WORDS} words (got {word_count}).",
        )
    if word_count > config.MAX_WORDS:
        raise HTTPException(status_code=422, detail="Script too long - split it into parts.")

    logger.info("promote_request word_count=%d provider=%s", word_count, config.provider_name())
    try:
        return map_script(body.script)
    except (JSONParseError, ProviderConfigError, ProviderError) as exc:
        return llm_error_to_response(
            exc,
            failure_code="generation_failed",
            failure_msg="The mapping engine returned an unreadable result. Try again.",
        )
