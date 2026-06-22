"""Blurb endpoint: POST /api/blurb. Accepts pasted text or an uploaded file."""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app import config
from app.deps import guard
from app.http_errors import llm_error_to_response
from app.providers import JSONParseError, ProviderConfigError, ProviderError
from app.services.blurb.extract import UnsupportedFormat, extract_text
from app.services.blurb.generator import generate_blurb
from app.services.blurb.models import BlurbResult, Length, Tone

logger = logging.getLogger("quietshelf.blurb")

router = APIRouter(prefix="/api", tags=["blurb"])


@router.post("/blurb", response_model=BlurbResult)
async def blurb(
    request: Request,
    text: str | None = Form(None),
    tone: Tone = Form(Tone.literary),
    length: Length = Form(Length.medium),
    file: UploadFile | None = File(None),
    _: None = Depends(guard),
):
    if file is not None:
        raw = await file.read()
        max_bytes = config.max_upload_mb() * 1024 * 1024
        if len(raw) > max_bytes:
            raise HTTPException(status_code=413, detail=f"File is larger than the {config.max_upload_mb()} MB limit.")
        try:
            manuscript = extract_text(raw, Path(file.filename or "upload").suffix.lower())
        except UnsupportedFormat as exc:
            return JSONResponse(status_code=415, content={"error": "unsupported_format", "message": str(exc)})
    else:
        manuscript = text or ""

    if len(manuscript.split()) < 50:
        raise HTTPException(
            status_code=422,
            detail="Need more text to work with - paste at least a few paragraphs (50+ words).",
        )

    logger.info("blurb_request words=%d tone=%s length=%s", len(manuscript.split()), tone.value, length.value)
    try:
        return generate_blurb(manuscript, tone=tone, length=length)
    except (JSONParseError, ProviderConfigError, ProviderError) as exc:
        return llm_error_to_response(
            exc,
            failure_code="generation_failed",
            failure_msg="The copywriter returned an unreadable result. Try again.",
        )
