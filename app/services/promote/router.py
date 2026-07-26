"""Promote endpoint: POST /api/promote and GET /api/promote/stream."""
from __future__ import annotations

import json
import logging
import queue
import threading

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

from app import config
from app.deps import guard
from app.http_errors import llm_error_to_response
from app.providers import JSONParseError, ProviderConfigError, ProviderError
from app.services.promote.mapper import (
    CHUNK_TARGET_WORDS,
    SYSTEM_PROMPT,
    CAST_ADDENDUM,
    _chunk_script,
    _try_map_chunk,
    _fallback_chunk,
    _ground_segment,
    _mmss,
    map_script,
)
from app.services.promote.models import PromoteRequest, Segment, ShotList
from app.services.storymap.grounding import MapParseError, cast_sheet, parse_map

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

    # Optional Story Map grounding. A bad attachment is a clear 422, never a
    # silent un-grounded run the writer believes was grounded.
    story_map = None
    if body.story_map is not None:
        try:
            story_map = parse_map(body.story_map)
        except MapParseError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

    logger.info(
        "promote_request word_count=%d provider=%s grounded=%s",
        word_count, config.provider_name(), story_map is not None,
    )
    try:
        return map_script(body.script, story_map=story_map)
    except (JSONParseError, ProviderConfigError, ProviderError) as exc:
        return llm_error_to_response(
            exc,
            failure_code="generation_failed",
            failure_msg="The mapping engine returned an unreadable result. Try again.",
        )


@router.post("/promote/stream")
def promote_stream(body: PromoteRequest, request: Request, _: None = Depends(guard)):
    """SSE endpoint: streams each chunk's segments as they complete so the
    frontend can render progressively instead of waiting for the full map.

    Events:
      data: {"type": "meta", "total_chunks": N, "title": "..."}  — sent first
      data: {"type": "chunk", "chunk_index": N, "segments": [...]}  — one per chunk
      data: {"type": "done", "estimated_runtime_seconds": N}  — sent last
      data: {"type": "error", "message": "..."}  — on failure
    """
    word_count = len(body.script.split())
    if word_count == 0:
        raise HTTPException(status_code=422, detail="Script is empty.")
    if word_count < config.MIN_WORDS:
        raise HTTPException(status_code=422, detail=f"Script too short — needs at least {config.MIN_WORDS} words.")
    if word_count > config.MAX_WORDS:
        raise HTTPException(status_code=422, detail="Script too long — split it into parts.")

    story_map = None
    if body.story_map is not None:
        try:
            story_map = parse_map(body.story_map)
        except MapParseError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

    cast_context = cast_sheet(story_map) if story_map else ""
    system = SYSTEM_PROMPT + (CAST_ADDENDUM.format(cast=cast_context) if cast_context else "")
    chunks = _chunk_script(body.script, CHUNK_TARGET_WORDS)
    total = len(chunks)

    logger.info("promote_stream chunks=%d grounded=%s", total, bool(cast_context))

    # Each worker thread puts its result into this queue as soon as it's done.
    # The generator below reads from it and yields SSE events — so the first
    # segments reach the browser the moment the fastest chunk finishes, not
    # after all of them do.
    result_queue: queue.Queue = queue.Queue()

    def worker(idx: int, chunk: str) -> None:
        try:
            result = _try_map_chunk(chunk, system)
            if result is None:
                result = _fallback_chunk(chunk)
            result_queue.put((idx, result, None))
        except Exception as exc:  # noqa: BLE001
            result_queue.put((idx, None, exc))

    # Fire all chunks concurrently — same as the batch endpoint.
    threads = [threading.Thread(target=worker, args=(i, c), daemon=True) for i, c in enumerate(chunks)]
    for t in threads:
        t.start()

    def event_stream():
        # Mutable state shared across the generator.
        cumulative = 0
        segment_id = 1
        title = ""
        received = 0

        yield f"data: {json.dumps({'type': 'meta', 'total_chunks': total})}\n\n"

        # Collect results in completion order (fastest chunk first).
        while received < total:
            try:
                idx, result, exc = result_queue.get(timeout=120)
            except queue.Empty:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Timed out waiting for chunks.'})}\n\n"
                return

            received += 1

            if exc is not None:
                logger.warning("promote_stream chunk %d failed: %s", idx, exc)
                result = _fallback_chunk(chunks[idx])

            if not title and result.video_title_suggestion.strip():
                title = result.video_title_suggestion.strip()

            segments_out = []
            for draft in result.segments:
                duration = max(1, int(draft.clip_duration_seconds))
                terms, cast = (
                    _ground_segment(draft.script_text, draft.search_terms, story_map.characters)
                    if story_map
                    else (draft.search_terms, [])
                )
                seg = Segment(
                    id=segment_id,
                    script_text=draft.script_text,
                    start_time=_mmss(cumulative),
                    end_time=_mmss(cumulative + duration),
                    search_terms=terms,
                    clip_duration_seconds=duration,
                    mood=draft.mood,
                    cast=cast,
                )
                segments_out.append(seg.model_dump())
                segment_id += 1
                cumulative += duration

            yield f"data: {json.dumps({'type': 'chunk', 'chunk_index': idx, 'segments': segments_out, 'chunks_done': received, 'total_chunks': total})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'title': title or 'Your video', 'estimated_runtime_seconds': cumulative})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # tells nginx not to buffer SSE
        },
    )
