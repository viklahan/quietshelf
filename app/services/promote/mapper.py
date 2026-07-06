"""Promote engine: split the script into bounded chunks, map them concurrently,
then stitch the segments into one timed shot list.

A single whole-script call was the bottleneck: the free model emits one giant
JSON object token by token (slow), and on longer scripts it overflows its own
output limit and truncates - which then fails to parse ("unreadable result").
Bounded chunks each generate a small JSON quickly and run in parallel.

Resilience: one flaky chunk must never tank the whole map. A chunk that won't
parse in the parallel pass is retried once on its own, and if it still fails it
gets a local, never-fails coarse mapping so the writer always gets complete
coverage (those segments are just lower quality - the keywords are editable).
"""
from __future__ import annotations

import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor

from app.providers import JSONParseError, ProviderRateLimited, generate_json
from app.services.promote.models import ChunkResult, ChunkSegment, Segment, ShotList

logger = logging.getLogger("quietshelf.promote")

CHUNK_TARGET_WORDS = 200      # ~80s of narration; keeps each JSON response small
RATE_LIMIT_RETRIES = 2        # per-chunk retries if a parallel burst gets throttled


def _max_concurrency() -> int:
    try:
        return max(1, int(os.getenv("PROMOTE_CONCURRENCY", "6")))
    except ValueError:
        return 6


SYSTEM_PROMPT = """\
You are a visual mapping engine for video essays that use stock footage.

You receive an EXCERPT from a longer narration script. Pace is ~150 words per minute.

Break this excerpt into visual segments (every 1-3 sentences, wherever the on-screen visual should change). For each segment provide:

- script_text: the exact sentences from the excerpt (do not paraphrase)
- search_terms: exactly 6 stock-footage search terms, ranked best first. Terms must be optimized for stock libraries like Pexels: simple, concrete, describing actions/settings/emotions ("man walking alone city night"), never abstract concepts ("loneliness of modern existence"). Prefer terms with high stock availability - avoid hyper-specific scenes that won't exist. Give a range of distinct angles (subject, setting, mood, action) so the writer has real choices.
- clip_duration_seconds: integer estimate of how long this segment stays on screen, from its narration length at ~150 wpm
- mood: one or two lowercase words (e.g., "hopeful", "tense", "warm")

Also provide:
- video_title_suggestion: a short working title for the whole video, your best guess from this excerpt's theme

Cover the COMPLETE excerpt from start to finish. Never summarize, skip, or stop early. Do not output start/end times - only clip_duration_seconds per segment.

Respond with ONLY a valid JSON object matching this structure. No markdown fences, no commentary, no preamble.
"""

# Tiny stop-word set for the local fallback keyword extractor.
_STOPWORDS = set(
    "the a an and or but of to in on at for with from by as is was were are be been "
    "it its this that these those he she they them his her their you your i we our us "
    "not no so if then than into over under out up down off about above below who whom "
    "which what when where why how all any both each few more most other some such".split()
)


def _split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def _chunk_script(script: str, target_words: int) -> list[str]:
    """Pack whole sentences into chunks of roughly `target_words` words."""
    chunks: list[str] = []
    current: list[str] = []
    current_words = 0
    for sentence in _split_sentences(script):
        words = len(sentence.split())
        if current and current_words + words > target_words:
            chunks.append(" ".join(current))
            current, current_words = [], 0
        current.append(sentence)
        current_words += words
    if current:
        chunks.append(" ".join(current))
    return chunks or [script.strip()]


def _mmss(total_seconds: int) -> str:
    minutes, seconds = divmod(max(0, int(total_seconds)), 60)
    return f"{minutes}:{seconds:02d}"


def _keywords(text: str, count: int = 6) -> list[str]:
    """Cheap keyword pull for the local fallback - good enough to seed an
    editable search; the writer refines it."""
    picked: list[str] = []
    for word in re.findall(r"[a-zA-Z']{4,}", text.lower()):
        if word not in _STOPWORDS and word not in picked:
            picked.append(word)
        if len(picked) >= count:
            break
    while len(picked) < 3:  # ChunkSegment requires at least 3
        picked.append("scene")
    return picked[:count]


def _map_chunk(chunk: str) -> ChunkResult:
    """Map one excerpt, retrying if the upstream still rate-limits us.

    The provider layer paces requests client-side, so a 429 here means the
    key's quota window is polluted by something outside this process. Quotas
    are per rolling MINUTE - a retry must wait long enough to reach a fresh
    window, or it just burns into the same dead one."""
    delay = 20.0
    for attempt in range(RATE_LIMIT_RETRIES + 1):
        try:
            return generate_json(SYSTEM_PROMPT, chunk, ChunkResult)
        except ProviderRateLimited:
            if attempt == RATE_LIMIT_RETRIES:
                raise
            time.sleep(delay)
            delay *= 1.5
    raise AssertionError("unreachable")


def _try_map_chunk(chunk: str) -> ChunkResult | None:
    """Returns None (-> local fallback) only when the model RESPONDED but its
    output was unparseable. Infrastructure failures (rate limit, upstream error,
    bad key) propagate so the writer gets an honest "try again" instead of a
    whole script silently degraded to keyword-only mapping."""
    try:
        return _map_chunk(chunk)
    except JSONParseError:
        logger.warning("chunk_parse_failed -> local fallback")
        return None


def _fallback_chunk(chunk: str) -> ChunkResult:
    """Local, never-fails coarse mapping (~2 sentences per segment) so a chunk
    the model couldn't handle still gets full coverage with editable keywords."""
    sentences = _split_sentences(chunk) or [chunk.strip()]
    segments: list[ChunkSegment] = []
    for i in range(0, len(sentences), 2):
        text = " ".join(sentences[i : i + 2]).strip()
        if not text:
            continue
        words = max(1, len(text.split()))
        segments.append(
            ChunkSegment(
                script_text=text,
                search_terms=_keywords(text),
                clip_duration_seconds=max(2, round(words / 150 * 60)),
                mood="neutral",
            )
        )
    return ChunkResult(video_title_suggestion="", segments=segments)


def map_script(script: str) -> ShotList:
    """Map a full script to a validated shot list via parallel chunk mapping."""
    chunks = _chunk_script(script, CHUNK_TARGET_WORDS)
    logger.info("promote_map chunks=%d", len(chunks))

    if len(chunks) == 1:
        results: list[ChunkResult | None] = [_try_map_chunk(chunks[0])]
    else:
        workers = min(_max_concurrency(), len(chunks))
        with ThreadPoolExecutor(max_workers=workers) as pool:
            results = list(pool.map(_try_map_chunk, chunks))

    # A chunk the model couldn't parse drops straight to a local coarse mapping
    # - never burn more slow model calls chasing one bad chunk (that turned a
    # 90s map into a 4-minute one). Coverage stays complete; keywords editable.
    for idx, result in enumerate(results):
        if result is None:
            logger.warning("chunk_fallback idx=%d", idx)
            results[idx] = _fallback_chunk(chunks[idx])

    segments: list[Segment] = []
    cumulative = 0
    title = ""
    for result in results:
        if not title and result.video_title_suggestion.strip():
            title = result.video_title_suggestion.strip()
        for draft in result.segments:
            duration = max(1, int(draft.clip_duration_seconds))
            segments.append(
                Segment(
                    id=len(segments) + 1,
                    script_text=draft.script_text,
                    start_time=_mmss(cumulative),
                    end_time=_mmss(cumulative + duration),
                    search_terms=draft.search_terms,
                    clip_duration_seconds=duration,
                    mood=draft.mood,
                )
            )
            cumulative += duration

    if not title and segments:  # last resort: the opening few words
        title = " ".join(segments[0].script_text.split()[:6]).rstrip(".,;:!?")

    return ShotList(
        video_title_suggestion=title or "Your video",
        estimated_runtime_seconds=cumulative,
        segments=segments,
    )
