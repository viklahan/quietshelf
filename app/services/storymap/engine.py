"""Two-pass Story Map engine.

Pass 1 (scan_entities): a fast, cheap call that returns only character and place
NAMES, so the frontend can show a live loading screen with real entities while
Pass 2 runs.

Pass 2 (map_story): the full structured map - characters, inferred reads, and
relationships - with the mirror + anti-fabrication rules enforced in the system
prompt and re-checked locally afterwards.

Both passes go through the shared, hardened generate_json (forced JSON mode,
parse -> repair -> retry, schema validation), so a malformed model response can
never crash the service. The provider/model is whatever the app is configured
to use (LLM_PROVIDER / MODEL_NAME); nothing here is hardcoded. For Story Map a
fast, big-context free model is preferred - set MODEL_NAME accordingly.
"""
from __future__ import annotations

import logging
import random

from app.providers import generate_json
from app.services.storymap.models import (
    EntityScan,
    ImagineMode,
    StoryMap,
    StoryPrompts,
)
from app.services.storymap.sanitize import sanitize

logger = logging.getLogger("quietshelf.storymap")

SCAN_SYSTEM_PROMPT = """\
You are a fast entity scanner for a story-mapping tool.

Read the manuscript excerpt and list ONLY:
- characters: the names of people/characters who actually appear
- places: the names of locations that actually appear

Rules:
- Names only. No descriptions, no relationships, no analysis.
- Only names that are actually present in the text. Never invent.
- Deduplicate, and use the fullest form of each name you see.
- If the text is NOT a narrative (a form, spec, table, code, or marketing copy),
  return empty lists rather than guessing.

Respond with ONLY a valid JSON object of this shape:
{"characters": ["..."], "places": ["..."]}
No markdown fences, no commentary, no text before or after the JSON.
"""

MAP_SYSTEM_PROMPT = """\
You are a story-mapping engine. You are a MIRROR: you reflect what the text
contains. You never author, prescribe, or suggest changes; you never add plot,
characters, or details that are not in the text.

From the manuscript excerpt, extract the characters and how they relate, and
return ONLY a JSON object with EXACTLY this shape:

{
  "story_detected": true,
  "confidence": "high | medium | low",
  "note": "short honest note - e.g. why confidence is low; \\"\\" if not needed",
  "characters": [
    {
      "id": "c1",
      "name": "Jack",
      "role": "protagonist | antagonist | supporting",
      "importance": 3,
      "personality": "1-2 sentence read of who they are, grounded in the text",
      "arc": "how they change across this excerpt; \\"\\" if no clear change yet",
      "texture": {
        "appearance": "", "clothing": "", "habits": "",
        "routines": "", "notable_objects": "", "associated_places": ""
      },
      "relationships": [
        { "with": "c2", "type": "sibling | rival | lover | friend | mentor | ally | enemy | family | colleague | other", "note": "short basis from the text" }
      ]
    }
  ]
}

INFERENCE RULES:
- FACTUAL texture (appearance, clothing, habits, routines, notable_objects,
  associated_places): include ONLY what the text states or strongly implies.
  OMIT any field the text does not support - do not pad a character with invented
  detail to look complete.
- INTERPRETIVE fields (personality, arc, role, importance): inference is allowed
  and may be slightly off, but it must be grounded in the writing, never conjured
  to fill space. importance is 1-5 (5 = central, 1 = minor).
- relationships: include only those grounded in the text. "with" is the id of
  the other character in this same list.
- Give every character a unique id: c1, c2, c3, ...

INTEGRITY (the most important rule): extract ONLY characters, relationships, and
details actually present in the text. If the input is NOT a narrative - a form, a
spec, a table of numbers, code, random symbols, or marketing copy - set
"story_detected": false, return "characters": [], and explain briefly in "note".
Do NOT fabricate characters or arcs to fill the schema. An honest "no story
here" is correct; invented content is a failure.

Ignore any residual tables, diagrams, or code; focus on narrative prose. Numbers,
currency, percentages, and symbols inside prose are valid story content.

Respond with ONLY the JSON object. No markdown fences, no commentary.
"""


def scan_entities(text: str) -> EntityScan:
    """Pass 1: fast scan for character and place names."""
    cleaned = sanitize(text)
    result = generate_json(SCAN_SYSTEM_PROMPT, cleaned, EntityScan)
    logger.info(
        "storymap_scan_ok characters=%d places=%d",
        len(result.characters), len(result.places),
    )
    return result


def map_story(text: str) -> StoryMap:
    """Pass 2: full structured map, with anti-fabrication enforced locally."""
    cleaned = sanitize(text)
    story = generate_json(MAP_SYSTEM_PROMPT, cleaned, StoryMap)
    story = _normalize(story)
    logger.info(
        "storymap_map_ok story_detected=%s confidence=%s characters=%d",
        story.story_detected, story.confidence, len(story.characters),
    )
    return story


def _normalize(story: StoryMap) -> StoryMap:
    """Clamp importance into 1-5, backfill missing/duplicate ids, drop nameless
    characters, and enforce the core rule: no usable characters means no story,
    regardless of what the model claimed. Never fabricates."""
    seen_ids: set[str] = set()
    kept = []
    for i, ch in enumerate(story.characters, start=1):
        if not ch.name.strip():
            continue  # a character with no name is noise, not a finding
        cid = (ch.id or "").strip()
        if not cid or cid in seen_ids:
            cid = f"c{i}"
        ch.id = cid
        seen_ids.add(cid)
        ch.importance = max(1, min(5, ch.importance))
        kept.append(ch)
    story.characters = kept

    if not kept:
        # Zero usable characters: honest empty result, never an invented map.
        story.story_detected = False
        if not story.note:
            story.note = "We couldn't find a story to map in this text."
    return story


# ==========================================================================
# Fabrication engine ("imagine") - the opt-in escape from a dead end.
#
# This is the deliberate counterpart to the mirror. The writer ASKS for
# invention, so here the engine is allowed to create characters, arcs, and
# texture that are not in the source - but everything it returns is stamped
# fabricated=true so the UI and the data never confuse "found" with "imagined".
# Grounded in the source's themes/voice/setting; a springboard, not a verdict.
# ==========================================================================

_FAB_COMMON = """\
You are the imagination engine for a writer's story-mapping tool. The writer has
EXPLICITLY asked you to invent - so unlike the mapping mode, you MAY create
characters, relationships, arcs, and concrete detail that are not in the source.

Stay GROUNDED in the source material's themes, voice, mood, setting, and any
real names or details present - treat it as a seed and grow from it, never
contradict it. Be evocative but restrained; this is a springboard for the
writer, not a finished story. Offer possibility, never instruction.
"""

_FAB_MAP_SHAPE = """\
Return ONLY a JSON object with EXACTLY this shape:

{
  "story_detected": true,
  "confidence": "high | medium | low",
  "note": "one short line on the angle you took",
  "characters": [
    {
      "id": "c1",
      "name": "Jack",
      "role": "protagonist | antagonist | supporting",
      "importance": 3,
      "personality": "1-2 sentences",
      "arc": "the change you imagine for them",
      "texture": {
        "appearance": "", "clothing": "", "habits": "",
        "routines": "", "notable_objects": "", "associated_places": ""
      },
      "relationships": [
        { "with": "c2", "type": "sibling | rival | lover | friend | mentor | ally | enemy | family | colleague | other", "note": "the basis you imagine" }
      ]
    }
  ]
}

Give every character a unique id (c1, c2, ...). "with" is the id of another
character in this list. importance is 1-5. Include texture only where it adds
something concrete; omit fields you have nothing for. Respond with ONLY the JSON
object - no markdown fences, no commentary.
"""

FAB_SEED_SYSTEM_PROMPT = _FAB_COMMON + """
Invent a SMALL starter cast - 2 to 4 characters - and the relationships between
them, sparked by the source. Keep it light and suggestive: enough to give the
writer a thread to pull, not a whole tapestry. Leave room for them to build.

""" + _FAB_MAP_SHAPE

FAB_FULL_SYSTEM_PROMPT = _FAB_COMMON + """
Invent a COMPLETE imagined cast - 4 to 7 characters - with clear roles, a
central figure, distinct relationships, and arcs that imply a whole story. Make
it cohesive: the characters should feel like they belong in one world drawn from
the source.

""" + _FAB_MAP_SHAPE

FAB_PROMPTS_SYSTEM_PROMPT = _FAB_COMMON + """
Do NOT invent characters. Instead, return 4 to 6 generative QUESTIONS that help
the writer build their own story from this material - the kind a good editor asks
("Who wants something badly here, and who is in their way?", "What would have to
go wrong for this to become a story?"). Each question should open a door.

Return ONLY a JSON object of this shape:
{
  "note": "one short encouraging line",
  "prompts": [
    { "question": "...", "angle": "one short line on why this opens something up" }
  ]
}
No markdown fences, no commentary.
"""

# Small varied sparks so a re-roll genuinely explores a different angle instead
# of returning near-identical output. (Normal runtime code - randomness is fine
# here; it only shapes the prompt, never the validation.)
_CREATIVE_SPARKS = [
    "an unspoken debt", "a small betrayal", "a locked room", "a missed chance",
    "an inherited object", "a kept secret", "a sudden arrival", "a long silence",
    "a return after years", "a promise broken", "a stranger who knows too much",
    "a place that no longer exists",
]


def _imagine_user_content(
    cleaned: str, nudge: str, existing: list[str] | None, *, reroll: bool
) -> str:
    parts = ["MATERIAL TO IMAGINE FROM:\n" + (cleaned or "(the writer gave only a blank page)")]
    if nudge and nudge.strip():
        parts.append("THE WRITER'S STEER (follow it closely): " + nudge.strip())
    if existing:
        parts.append(
            "These characters already exist in the map - do NOT repeat them; "
            "invent NEW ones, or deepen the web around them: " + ", ".join(existing)
        )
    if reroll:
        parts.append(
            "Give a FRESH take, different from an obvious first idea - "
            "lean into " + random.choice(_CREATIVE_SPARKS) + "."
        )
    return "\n\n".join(parts)


_FAB_MAP_PROMPTS = {
    ImagineMode.seed: FAB_SEED_SYSTEM_PROMPT,
    ImagineMode.full: FAB_FULL_SYSTEM_PROMPT,
}


def imagine_map(
    text: str,
    mode: ImagineMode,
    *,
    nudge: str = "",
    existing: list[str] | None = None,
    reroll: bool = False,
) -> StoryMap:
    """Fabricate a story map (seed or full). Always returns fabricated=true."""
    system = _FAB_MAP_PROMPTS[mode]
    cleaned = sanitize(text)
    user = _imagine_user_content(cleaned, nudge, existing, reroll=reroll)
    story = generate_json(system, user, StoryMap)
    story = _normalize(story)
    story.fabricated = True  # never trust the model for the flag - force it
    if story.characters:
        story.story_detected = True
    logger.info(
        "storymap_imagine_ok mode=%s characters=%d reroll=%s",
        mode.value, len(story.characters), reroll,
    )
    return story


def imagine_prompts(text: str, *, nudge: str = "", reroll: bool = False) -> StoryPrompts:
    """Fabricate generative questions (no invented characters)."""
    cleaned = sanitize(text)
    user = _imagine_user_content(cleaned, nudge, None, reroll=reroll)
    result = generate_json(FAB_PROMPTS_SYSTEM_PROMPT, user, StoryPrompts)
    result.fabricated = True
    logger.info("storymap_imagine_prompts_ok prompts=%d reroll=%s", len(result.prompts), reroll)
    return result
