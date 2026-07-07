"""Cast-sheet grounding: render a saved Story Map into a compact prompt block
other services can attach, so the confirmed cast becomes shared truth instead
of something each engine re-guesses on every run.

The fabricated stamp TRAVELS: an imagined map renders under an IMAGINED header
so no downstream prompt can mistake invention for a reading of the text.
"""
from __future__ import annotations

import json

from pydantic import ValidationError

from app.services.storymap.models import StoryMap


class MapParseError(ValueError):
    """The attached story map could not be read as a Quiet Shelf story map."""


def parse_map(data: object) -> StoryMap:
    if not isinstance(data, dict):
        raise MapParseError("The attached story map is not a story map object.")
    try:
        return StoryMap.model_validate(data)
    except ValidationError as exc:
        raise MapParseError(
            "The attached story map does not look like a Quiet Shelf story map - re-save it from the Story Map tab."
        ) from exc


def parse_map_json(raw: str) -> StoryMap:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise MapParseError("The attached story map is not valid JSON - re-save it from the Story Map tab.") from exc
    return parse_map(data)


_FOUND_HEADER = (
    "CAST SHEET - from the writer's Story Map, read from their own text. "
    "Treat it as ground truth for consistency: keep every name, role, and "
    "relationship exactly as given, never contradict it, and never invent "
    "characters beyond it."
)
_IMAGINED_HEADER = (
    "CAST SHEET - IMAGINED on the writer's explicit request (invented and "
    "writer-approved; NOT a reading of their text). Keep every name, role, and "
    "relationship exactly as given and never contradict it."
)

_TEXTURE_ORDER = (
    ("appearance", "appearance"),
    ("clothing", "clothing"),
    ("habits", "habits"),
    ("routines", "routines"),
    ("notable_objects", "objects"),
    ("associated_places", "places"),
)


def cast_sheet(story_map: StoryMap) -> str:
    """The grounding block, or '' when the map has no cast to ground with."""
    cast = story_map.characters
    if not cast:
        return ""
    names = {c.id: c.name for c in cast}
    lines = [_IMAGINED_HEADER if story_map.fabricated else _FOUND_HEADER, ""]
    for c in cast:
        head = f"- {c.name} ({c.role or 'supporting'}, importance {c.importance}/5)"
        if c.personality:
            head += f": {c.personality}"
        lines.append(head)
        if c.arc:
            lines.append(f"  arc: {c.arc}")
        details = [
            f"{label}: {value}"
            for key, label in _TEXTURE_ORDER
            if (value := getattr(c.texture, key, None))
        ]
        if details:
            lines.append("  " + "; ".join(details))
        for rel in c.relationships:
            who = names.get(rel.with_, rel.with_)
            note = f": {rel.note}" if rel.note else ""
            lines.append(f"  - with {who} ({rel.type or 'other'}){note}")
    return "\n".join(lines)
