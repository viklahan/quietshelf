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
Desired length of the back-cover copy: {length} (short ~80 words, medium ~130
words, full ~200 words).

The writer supplied ~{word_count} words of text. This may be an excerpt, not
the whole manuscript - never state it as the book's word count.

Produce a JSON object with exactly these fields:
- "back_cover_variants": an array of 2-3 genuinely distinct takes on the
  back-cover copy, all in the desired tone and length. Each take must come at
  the book from a different angle (e.g. character-led / mood-led / hook-led) -
  not paraphrases of each other.
- "taglines": an array of exactly 3 short, punchy taglines
- "short_description": a ~50-word store-listing description
- "keywords": an array of genre/category/keyword suggestions for store listings
- "query_paragraph": ONE paragraph for a query letter to a literary agent:
  the title if the text gives one, the hook, and the comp titles. Only state a
  word count if the writer's text states one - never invent numbers.
- "comps": an array of 2-3 comparable published titles, each as a single
  string formatted "Title - Author". Use real, well-known published books that
  genuinely match the genre and mood on the page; if you cannot name real
  comps confidently, give fewer rather than inventing any.

Respond with ONLY the JSON object. No markdown fences, no commentary.
"""

# Appended when the writer attaches their Story Map: the cast sheet is
# consistency ground truth, never new material to reveal or embellish.
_CAST_ADDENDUM = """

The writer also attached a cast sheet from their story map. It is ground truth
for names, roles, and relationships - keep the copy consistent with it. It is
NOT new plot to reveal and NOT license to invent scenes around those names.

{cast}
"""


def generate_blurb(
    text: str,
    *,
    tone: Tone = Tone.literary,
    length: Length = Length.medium,
    cast_context: str = "",
) -> BlurbResult:
    system = _SYSTEM.format(
        tone=tone.value, length=length.value, word_count=len(text.split())
    )
    if cast_context:
        system += _CAST_ADDENDUM.format(cast=cast_context)
    user = sample_text(text)
    return generate_json(system, user, BlurbResult)
