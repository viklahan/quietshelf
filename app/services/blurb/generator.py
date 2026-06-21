"""Blurb engine: a baked-in system prompt that infers genre/tone/audience and
writes marketing copy grounded strictly in the manuscript - never inventing
plot, spoilers, quotes, or reviews. One generate_json call."""
from __future__ import annotations

from app.providers import generate_json
from app.services.blurb.extract import sample_text
from app.services.blurb.models import BlurbResult, Length, Tone

_SYSTEM = """\
You are a book marketing copywriter. You are given an excerpt from a manuscript
(its opening and a passage from the middle). Infer the genre, tone, and intended
audience from what is actually on the page.

Write marketing copy GROUNDED ONLY in the supplied text. Do NOT invent plot
points, twists, character names, settings, spoilers, quotes, or reviews that are
not present. If the excerpt is thin, stay evocative and general rather than
fabricating specifics.

Desired tone of the copy: {tone}.
Desired length of the back-cover copy: {length} (short ~80 words, medium ~130 words).

Produce a JSON object with exactly these fields:
- "back_cover": back-cover copy (~100-150 words for medium, ~80 for short)
- "taglines": an array of exactly 3 short, punchy taglines
- "short_description": a ~50-word store-listing description
- "keywords": an array of genre/category/keyword suggestions for store listings

Respond with ONLY the JSON object. No markdown fences, no commentary.
"""


def generate_blurb(text: str, *, tone: Tone = Tone.literary, length: Length = Length.medium) -> BlurbResult:
    system = _SYSTEM.format(tone=tone.value, length=length.value)
    user = sample_text(text)
    return generate_json(system, user, BlurbResult)
