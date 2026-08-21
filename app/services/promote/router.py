"""Promote endpoint: POST /api/promote and GET /api/promote/stream."""
from __future__ import annotations

import json
import logging
import queue
import threading
import time

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse

from app import config
from app.deps import guard
from app.http_errors import llm_error_to_response
from app.providers import (
    JSONParseError,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
)
from app.services.promote.mapper import (
    NARRATION_WPM,
    narration_seconds,
    CHUNK_TARGET_WORDS,
    SYSTEM_PROMPT,
    CAST_ADDENDUM,
    _chunk_script,
    _try_map_chunk,
    _fallback_chunk,
    _ground_segment,
    _pad_short_terms,
    _mmss,
    _max_concurrency,
    map_script,
)
from app.services.promote.models import PromoteRequest, Segment, ShotList
from app.services.storymap.grounding import MapParseError, cast_sheet, parse_map

logger = logging.getLogger("quietshelf.promote")

SSE_HEARTBEAT_SECONDS = 10.0   # emit ": hb" comment when a chunk wait exceeds this
SSE_WAIT_TIMEOUT = 180.0       # overall per-wait ceiling before an honest error
# Groq free tier: 8,000 tokens/MINUTE, one chunk ~3,000. Throttling is the
# NORM on a multi-chunk script, not an error. These waits are long enough to
# reach a genuinely fresh window - a 3s backoff just re-hits the dead one.
RATE_LIMIT_WINDOW_SECONDS = 30.0
RATE_LIMIT_WAITS = 3            # up to 90s of patience before degrading


def _is_rate_limited(exc: Exception) -> bool:
    """True for throttling, which heals on its own, as opposed to a fault."""
    if isinstance(exc, ProviderRateLimited):
        return True
    text = str(exc).lower()
    return "rate limit" in text or "rate-limited" in text or "429" in text

router = APIRouter(prefix="/api", tags=["promote"])


def _extract_text_from_file(filename: str, content: bytes) -> str:
    """Extract plain text from DOCX, RTF, or TXT file bytes."""
    ext = Path(filename).suffix.lower()
    if ext == '.txt':
        return content.decode('utf-8', errors='ignore')
    if ext == '.rtf':
        from striprtf.striprtf import rtf_to_text
        return rtf_to_text(content.decode('utf-8', errors='ignore'))
    if ext == '.docx':
        import io
        import docx
        doc = docx.Document(io.BytesIO(content))
        # Keep blank paragraphs — they are the writer's thought-group boundaries
        # that the beat chunker relies on. Do NOT filter them out.
        return '\n'.join(p.text for p in doc.paragraphs)
    raise HTTPException(status_code=415, detail=f"Unsupported file type '{ext}'. Upload DOCX, RTF, or TXT.")


@router.post("/promote/extract")
async def promote_extract(
    file: UploadFile = File(...),
    _: None = Depends(guard),
):
    """Extract plain text from an uploaded manuscript file.
    Returns {text: str, word_count: int} so the frontend can populate
    the Promote textarea and validate length before streaming.
    """
    content = await file.read()
    text = _extract_text_from_file(file.filename or 'upload', content)
    text = text.strip()
    word_count = len(text.split())
    return {"text": text, "word_count": word_count}


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
    from app.services.promote.mapper import _clean_transcript
    _cleaned, detected_title = _clean_transcript(body.script)
    chunks = _chunk_script(body.script, CHUNK_TARGET_WORDS)
    total = len(chunks)
    concurrency = min(_max_concurrency(), total)

    # Pre-calculate each chunk's start time offset from word counts.
    # This lets us stream chunks in ARRIVAL order (fast, progressive)
    # while keeping timestamps correct — no waiting for chunk N-1.
    def _words_before(idx: int) -> int:
        return sum(len(c.split()) for c in chunks[:idx])
    # Offsets carried in WORDS, converted to seconds only when a timestamp is
    # printed. Rounding each segment's duration independently and summing them
    # drifts against the chunk's own single rounding - about half a second per
    # segment - so a chunk of eight could still overrun the next chunk's start
    # and put the running order back in time. One rounding per boundary cannot.
    chunk_word_offsets = [_words_before(i) for i in range(total)]
    chunk_offsets = [narration_seconds(' '.join(['w'] * w)) if w else 0
                     for w in chunk_word_offsets]

    logger.info("promote_stream chunks=%d concurrency=%d grounded=%s", total, concurrency, bool(cast_context))

    result_queue: queue.Queue = queue.Queue()
    sem = threading.Semaphore(concurrency)

    def worker(idx: int, chunk: str) -> None:
        with sem:
            # A chunk that falls to _fallback_chunk becomes keyword garbage
            # (single-word padded terms, NEUTRAL mood) — visibly worse than a
            # real mapping, and an insult to someone's original writing. It is
            # the last resort, never the impatient one.
            last_exc = None
            attempts = 0
            rate_waits = 0
            while True:
                try:
                    result = _try_map_chunk(chunk, system)
                    if result is not None:
                        result_queue.put((idx, result, None))
                        return
                    last_exc = None  # None = parse failure; a retry may parse
                except Exception as exc:  # noqa: BLE001
                    last_exc = exc
                    if getattr(exc, "permanent", False):
                        # Every provider is permanently down (dead keys /
                        # unpaid / daily quota gone). More retries = more
                        # minutes of the same errors. Fall back NOW.
                        break
                    # A RATE LIMIT IS A QUEUE, NOT A FAILURE. Groq's free tier
                    # allows 8,000 tokens/MINUTE and one chunk is ~3,000, so a
                    # multi-chunk script throttles by design. The old backoff
                    # was 3s then 6s — both land in the SAME dead window, burn
                    # every attempt, and hand the writer keyword garbage for a
                    # chunk that only needed to wait. Waiting costs seconds;
                    # degrading costs them their work. Rate-limit waits get
                    # their own budget and do not consume normal attempts.
                    if _is_rate_limited(exc) and rate_waits < RATE_LIMIT_WAITS:
                        rate_waits += 1
                        logger.info(
                            "promote_stream chunk %d throttled - waiting %.0fs for a "
                            "fresh window (wait %d/%d)",
                            idx, RATE_LIMIT_WINDOW_SECONDS, rate_waits, RATE_LIMIT_WAITS,
                        )
                        time.sleep(RATE_LIMIT_WINDOW_SECONDS)
                        continue
                attempts += 1
                if attempts >= 3:
                    break
                time.sleep(3.0 * attempts)  # 3s, 6s for non-throttle failures
            # All attempts failed — last resort keyword mapping
            logger.warning("promote_stream chunk %d exhausted retries: %s", idx, last_exc)
            result_queue.put((idx, _fallback_chunk(chunk), None))

    threads = [threading.Thread(target=worker, args=(i, c), daemon=True) for i, c in enumerate(chunks)]
    for t in threads:
        t.start()

    def event_stream():
        title = ""
        received = 0
        segment_id = [0]  # mutable counter via list

        yield f"data: {json.dumps({'type': 'meta', 'total_chunks': total})}\n\n"

        def render(idx: int, result) -> str:
            """Turn one mapped chunk into its SSE line. Shared by the normal
            arrival path and the stall-recovery path below, so a recovered
            chunk is indistinguishable in shape from any other."""
            nonlocal title
            if not title and result.video_title_suggestion.strip():
                title = result.video_title_suggestion.strip()
            cumulative_words = chunk_word_offsets[idx]
            segments_out = []
            for draft in result.segments:
                seg_words = max(1, len(draft.script_text.split()))
                start_at = round(cumulative_words / NARRATION_WPM * 60)
                end_at = round((cumulative_words + seg_words) / NARRATION_WPM * 60)
                duration = max(1, end_at - start_at)
                cumulative_words += seg_words
                terms, cast = (
                    _ground_segment(draft.script_text, draft.search_terms, story_map.characters)
                    if story_map
                    else (draft.search_terms, [])
                )
                terms = _pad_short_terms(terms, draft.script_text)
                segment_id[0] += 1
                seg = Segment(
                    id=segment_id[0],
                    script_text=draft.script_text,
                    start_time=_mmss(start_at),
                    end_time=_mmss(start_at + duration),
                    search_terms=terms,
                    clip_duration_seconds=duration,
                    mood=draft.mood,
                    cast=cast,
                    needs_remap=getattr(draft, 'needs_remap', False),
                )
                segments_out.append(seg.model_dump())
            return "data: " + json.dumps({
                'type': 'chunk', 'chunk_index': idx, 'segments': segments_out,
                'chunks_done': received, 'total_chunks': total,
            }) + "\n\n"

        seen: set[int] = set()
        while received < total:
            # Poll in short slices, emitting SSE heartbeat comments during long
            # provider waits. Pacing + retry ladders can silence the stream for
            # minutes, and nginx kills a silent upstream at proxy_read_timeout
            # (default 60s) — surfacing as ERR_INCOMPLETE_CHUNKED_ENCODING in
            # the browser. Comment lines (": ...") are ignored by EventSource
            # and by our own parser, but they keep the pipe audibly alive.
            waited = 0.0
            stalled = False
            while True:
                try:
                    idx, result, exc = result_queue.get(timeout=SSE_HEARTBEAT_SECONDS)
                    break
                except queue.Empty:
                    waited += SSE_HEARTBEAT_SECONDS
                    if waited >= SSE_WAIT_TIMEOUT:
                        stalled = True
                        break
                    yield ": hb\n\n"

            if stalled:
                # A chunk stopped answering. Until 2026-08-20 this did a bare
                # `return`, which threw away EVERY remaining chunk - including
                # ones already mapped or certain to succeed. A writer on the
                # live site got a third of their script back and no explanation.
                # The writer's script is the contract: a stall costs THAT chunk
                # (keyword fallback, flagged needs_remap so the UI shows it and
                # the remap button can fix it), never the remainder.
                outstanding = [i for i in range(total) if i not in seen]
                logger.warning(
                    "promote_stream stalled after %d/%d chunks - "
                    "falling back %d chunk(s) rather than discarding them",
                    received, total, len(outstanding),
                )
                for missing in outstanding:
                    seen.add(missing)
                    received += 1
                    yield render(missing, _fallback_chunk(chunks[missing]))
                break

            seen.add(idx)
            received += 1

            if exc is not None:
                logger.warning("promote_stream chunk %d failed: %s", idx, exc)
                result = _fallback_chunk(chunks[idx])

            # Emit immediately in arrival order — fast and progressive
            yield render(idx, result)

        yield f"data: {json.dumps({'type': 'done', 'title': detected_title or title or 'Your video', 'estimated_runtime_seconds': chunk_offsets[-1]})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # tells nginx not to buffer SSE
        },
    )
