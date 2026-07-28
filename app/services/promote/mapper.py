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

from app.providers import (
    JSONParseError,
    ProviderError,
    ProviderRateLimited,
    generate_json,
)
from app.services.promote.models import ChunkResult, ChunkSegment, Segment, ShotList
from app.services.storymap.grounding import cast_sheet
from app.services.storymap.models import Character, StoryMap

logger = logging.getLogger("quietshelf.promote")

CHUNK_TARGET_WORDS = 400      # ~160s of narration per chunk. 200 was too small —
                               # fragments lack narrative context for good search terms.
                               # 400 halves API calls and doubles coherence.
RATE_LIMIT_RETRIES = 2        # per-chunk retries if a parallel burst gets throttled


def _max_concurrency() -> int:
    try:
        return max(1, int(os.getenv("PROMOTE_CONCURRENCY", "6")))
    except ValueError:
        return 6


SYSTEM_PROMPT = """\
You are a cinematographer's assistant choosing stock b-roll for a narrated video essay.

You receive a PASSAGE from the writer's script. The writer has already broken it
into beats — each LINE is one deliberate narration beat, paced for the video.
Blank lines separate thought-groups.

YOUR JOB: map b-roll to the writer's beats. Group 1-3 consecutive lines into a
visual segment wherever the on-screen image should change. Honor the line breaks
— they are the writer's pacing. Do NOT rewrite or re-paragraph the text.

These are REFLECTIVE essays about life, feelings, relationships, and inner
experience — not action stories. The b-roll is mood and symbol, not literal action.

For each segment provide:

- script_text: the EXACT lines from the passage, copied verbatim (keep them as written)
- search_terms: exactly 6 stock-footage search terms describing what a CAMERA
  would show under these words. For reflective essays, think in evocative but
  FILMABLE images:

  For an essay about achievement feeling hollow: "person staring out window quietly",
  "empty office after hours desk lamp", "hand setting down trophy on shelf",
  "person walking alone city sidewalk", "coffee going cold by laptop", "blank
  ceiling view lying in bed"

  For an essay about friendships fading: "two empty chairs cafe table", "phone
  screen unanswered message", "person scrolling alone on couch night", "old
  photos scattered on floor", "empty swing moving slightly", "distant figure
  walking away train platform"

  Ask for each term: "Can a camera lens see this?" If it's an abstract noun
  ("loneliness", "regret", "time"), rewrite it as a filmable scene.
  Each term MUST be 2-5 words. No single words. No abstractions.
  Give 6 different angles: wide/atmosphere, medium/subject, close-up/detail,
  environment, a person in the scene, and an object or symbol.

- clip_duration_seconds: integer seconds on screen, from the line length at ~150 wpm
- mood: one or two lowercase words ("reflective", "wistful", "hollow", "tender",
  "melancholy", "quiet", "hopeful", "unsettled", "resigned", "bittersweet")

Also provide:
- video_title_suggestion: a short working title from the passage theme

RULES:
1. Cover EVERY line in the passage. Never skip or stop early.
2. script_text = the writer's exact lines, verbatim.
3. Every search term = 2-5 words, filmable, specific. No single words, no abstractions.
4. These are reflective essays — b-roll is mood and symbol, not literal action.

Respond with ONLY valid JSON. No markdown, no commentary.
"""

# Appended when the writer attaches their Story Map. The sheet makes search
# terms CONCRETE and consistent across segments (the same character keeps the
# same look and places), but the excerpt on the page always wins.
CAST_ADDENDUM = """

The writer attached a cast sheet from their story map. When a segment involves
a named character, use their appearance, places, and objects from the sheet to
make search terms concrete and consistent across segments (e.g. "woman red coat
harbor dusk" instead of a generic person). Never let sheet details override
what the excerpt actually says.

{cast}
"""

# Tiny stop-word set for the local fallback keyword extractor.
_STOPWORDS = set(
    "the a an and or but of to in on at for with from by as is was were are be been "
    "it its this that these those he she they them his her their you your i we our us "
    "not no so if then than into over under out up down off about above below who whom "
    "which what when where why how all any both each few more most other some such".split()
)


def _clean_transcript(text: str) -> tuple[str, str]:
    """Clean a pasted script or YouTube transcript before mapping.

    Handles the two real input formats the writer uses:
    1. Pre-production script (DOCX/RTF/paste): title on first line, then one
       narration beat per line, ellipsis-heavy, blank lines separating thought
       groups.
    2. YouTube auto-transcript: [music] tags, timestamp lines (0:00), ALLCAPS
       section headers jammed inline.

    Returns (cleaned_text, detected_title). Cleaned text preserves the writer's
    line breaks (each line is a deliberate beat) but strips noise.
    """
    # Strip bracketed tags: [music], [applause], [Music], etc.
    text = re.sub(r'\[[^\]]{0,40}\]', ' ', text)

    lines = text.split('\n')
    cleaned: list[str] = []
    title = ""

    # Timestamp line: "0:00", "1:23", "12:04" possibly with trailing text
    ts_only = re.compile(r'^\s*\d{1,2}:\d{2}\s*$')
    ts_prefix = re.compile(r'^\s*\d{1,2}:\d{2}\s+')
    # ALLCAPS header: mostly uppercase letters, few or no lowercase, no end punctuation
    allcaps = re.compile(r'^[^a-z]{6,}$')

    for raw in lines:
        line = raw.strip()
        if not line:
            cleaned.append('')  # preserve blank-line thought-group boundary
            continue
        if ts_only.match(line):
            continue  # drop pure timestamp lines
        line = ts_prefix.sub('', line)  # strip leading timestamp on caption lines
        line = line.strip()
        if not line:
            continue
        # ALLCAPS section header -> keep as its own beat but strip to title case
        # so it reads as a section marker, not shouted content
        if allcaps.match(line) and len(line.split()) <= 8:
            cleaned.append('')  # blank before header = new thought group
            cleaned.append(line.title())
            cleaned.append('')
            continue
        cleaned.append(line)

    # Detect title: first non-empty line, if short and lacks ending punctuation
    for i, line in enumerate(cleaned):
        if line.strip():
            candidate = line.strip()
            if len(candidate) < 70 and candidate[-1] not in '.…,?!"\'':
                title = candidate
                cleaned[i] = ''  # remove title from mappable content
            break

    # Collapse runs of 3+ blank lines to at most one
    result: list[str] = []
    blank_run = 0
    for line in cleaned:
        if not line.strip():
            blank_run += 1
            if blank_run <= 1:
                result.append('')
        else:
            blank_run = 0
            result.append(line)

    return '\n'.join(result).strip(), title


def _beats(text: str) -> list[list[str]]:
    """Split cleaned text into thought-groups of beats.

    Each LINE is one beat (the writer's deliberate pacing). Blank lines are
    hard boundaries between thought-groups. Returns a list of groups, where
    each group is a list of beat strings. Footage never cuts across a group
    boundary (the writer's pause).

    Multi-line ellipsis paragraphs ("planned around…\nwaited for.") that the
    DOCX reader joined with \n get treated as separate beats — which is right,
    they ARE separate narration beats.
    """
    groups: list[list[str]] = []
    current: list[str] = []
    for raw in text.split('\n'):
        line = raw.strip()
        if not line:
            if current:
                groups.append(current)
                current = []
        else:
            current.append(line)
    if current:
        groups.append(current)
    return groups


def _split_sentences(text: str) -> list[str]:
    """Legacy sentence splitter, kept for the local fallback path only.
    The main chunker now uses _beats() to honor the writer's line breaks."""
    paragraphs = re.split(r'\n{2,}', text.strip())
    sentences: list[str] = []
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        parts = re.split(r'(?<=[.!?…])\s+', para)
        for part in parts:
            part = part.strip()
            if part:
                sentences.append(part)
    return sentences or [text.strip()]


def _chunk_script(script: str, target_words: int) -> list[str]:
    """Group the writer's beats into chunks for the AI, honoring line breaks.

    Each chunk is a set of consecutive beats that:
    - never crosses a blank-line (thought-group) boundary mid-beat, and
    - stays under target_words so the JSON response stays small and fast.

    The AI receives beats separated by newlines and is told to map each beat
    (or tight run of beats) to one visual — preserving the writer's pacing
    instead of re-segmenting freely.
    """
    cleaned, _title = _clean_transcript(script)
    groups = _beats(cleaned)

    chunks: list[str] = []
    current: list[str] = []
    current_words = 0

    for group in groups:
        group_text = '\n'.join(group)
        group_words = len(group_text.split())
        # If adding this whole group would blow the target, flush first
        if current and current_words + group_words > target_words:
            chunks.append('\n'.join(current))
            current, current_words = [], 0
        # A single group larger than target: split it beat-by-beat
        if group_words > target_words:
            for beat in group:
                bw = len(beat.split())
                if current and current_words + bw > target_words:
                    chunks.append('\n'.join(current))
                    current, current_words = [], 0
                current.append(beat)
                current_words += bw
        else:
            current.extend(group)
            current_words += group_words

    if current:
        chunks.append('\n'.join(current))
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


def _map_chunk(chunk: str, system: str = SYSTEM_PROMPT) -> ChunkResult:
    """Map one excerpt, retrying the two transient upstream failures.

    Rate limits: the provider layer paces requests client-side, so a 429 here
    means the key's quota window is polluted by something outside this
    process. Quotas are per rolling MINUTE - a retry must wait long enough to
    reach a fresh window, or it just burns into the same dead one.

    Upstream 5xx: with 15 chunks per script, one flaky model response per run
    is the NORM, not the exception - and without a retry that single chunk
    tanks the entire map into a 502. One quick retry; if it fails again the
    error propagates honestly."""
    rate_delay = 20.0
    rate_retries = 0
    upstream_retries = 0
    while True:
        try:
            return generate_json(system, chunk, ChunkResult)
        except ProviderRateLimited:
            if rate_retries >= RATE_LIMIT_RETRIES:
                raise
            rate_retries += 1
            time.sleep(rate_delay)
            rate_delay *= 1.5
        except ProviderError:  # after ProviderRateLimited - it subclasses this
            if upstream_retries >= 1:
                raise
            upstream_retries += 1
            logger.warning("chunk_upstream_error -> one retry")
            time.sleep(2.0)


def _try_map_chunk(chunk: str, system: str = SYSTEM_PROMPT) -> ChunkResult | None:
    """Returns None (-> local fallback) only when the model RESPONDED but its
    output was unparseable. Infrastructure failures (rate limit, upstream error,
    bad key) propagate so the writer gets an honest "try again" instead of a
    whole script silently degraded to keyword-only mapping."""
    try:
        return _map_chunk(chunk, system)
    except JSONParseError:
        logger.warning("chunk_parse_failed -> local fallback")
        return None


def _anchor_term(ch: Character) -> str:
    """One canonical, deterministic search string per character, from the
    concrete texture the writer's map actually contains (appearance + places -
    the visual signature). Nothing is inferred; no texture, no anchor. The same
    anchor lands on the same stock-search results page for every segment the
    character appears in - that consistency is the whole point."""
    words: list[str] = []
    for attr in ("appearance", "associated_places"):
        value = getattr(ch.texture, attr, None)
        if value:
            words.extend(w.strip(",.;:!?") for w in value.lower().split())
    unique = list(dict.fromkeys(w for w in words if w))
    return " ".join(unique[:5])


def _mentions(text: str, name: str) -> bool:
    return bool(re.search(rf"\b{re.escape(name)}\b", text, re.IGNORECASE))


def _ground_segment(text: str, terms: list[str], cast: list[Character]) -> tuple[list[str], list[str]]:
    """Anchor a segment to the characters actually named in its text.
    Returns (search_terms with anchors prepended, names present)."""
    present = [ch for ch in cast if _mentions(text, ch.name)]
    grounded = list(terms)
    # Prepend in reverse so the first-listed (most important) character's
    # anchor ends up ranked first.
    for ch in reversed(present):
        anchor = _anchor_term(ch)
        if anchor and all(anchor != t.lower().strip() for t in grounded):
            grounded.insert(0, anchor)
    return grounded[:8], [ch.name for ch in present]


def _pad_short_terms(terms: list[str], context: str) -> list[str]:
    """Ensure no single-word terms reach the UI. If a term is one word,
    pad it with a context word from the segment text."""
    context_words = [w for w in re.findall(r'[a-zA-Z]{4,}', context.lower())
                     if w not in _STOPWORDS]
    result = []
    for term in terms:
        words = term.strip().split()
        if len(words) < 2 and context_words:
            # Append first unused context word
            for cw in context_words:
                if cw not in term.lower():
                    term = term + ' ' + cw
                    break
        result.append(term)
    return result


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
                needs_remap=True,  # AI didn't map this — flag it for the writer
            )
        )
    return ChunkResult(video_title_suggestion="", segments=segments)


def map_script(script: str, story_map: StoryMap | None = None) -> ShotList:
    """Map a full script to a validated shot list via parallel chunk mapping.
    story_map, when present, grounds the run twice over: every chunk sees the
    cast sheet in its prompt, and each stitched segment gets the deterministic
    anchor term + cast names for the characters actually mentioned in it."""
    cast_context = cast_sheet(story_map) if story_map else ""
    system = SYSTEM_PROMPT + (CAST_ADDENDUM.format(cast=cast_context) if cast_context else "")
    _cleaned, detected_title = _clean_transcript(script)
    chunks = _chunk_script(script, CHUNK_TARGET_WORDS)
    logger.info("promote_map chunks=%d grounded=%s", len(chunks), bool(cast_context))

    if len(chunks) == 1:
        results: list[ChunkResult | None] = [_try_map_chunk(chunks[0], system)]
    else:
        workers = min(_max_concurrency(), len(chunks))
        with ThreadPoolExecutor(max_workers=workers) as pool:
            results = list(pool.map(lambda chunk: _try_map_chunk(chunk, system), chunks))

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
            terms, cast = (
                _ground_segment(draft.script_text, draft.search_terms, story_map.characters)
                if story_map
                else (draft.search_terms, [])
            )
            terms = _pad_short_terms(terms, draft.script_text)
            segments.append(
                Segment(
                    id=len(segments) + 1,
                    script_text=draft.script_text,
                    start_time=_mmss(cumulative),
                    end_time=_mmss(cumulative + duration),
                    search_terms=terms,
                    clip_duration_seconds=duration,
                    mood=draft.mood,
                    cast=cast,
                    needs_remap=getattr(draft, 'needs_remap', False),
                )
            )
            cumulative += duration

    if not title and segments:  # last resort: the opening few words
        title = " ".join(segments[0].script_text.split()[:6]).rstrip(".,;:!?")

    return ShotList(
        video_title_suggestion=detected_title or title or "Your video",
        estimated_runtime_seconds=cumulative,
        segments=segments,
    )
