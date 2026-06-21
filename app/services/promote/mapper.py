"""Promote engine: the baked-in visual-mapping prompt + one generate_json call."""
from __future__ import annotations

from app.providers import generate_json
from app.services.promote.models import ShotList

SYSTEM_PROMPT = """\
You are a visual mapping engine for video essays that use stock footage.

You receive a full script. Narration pace is ~150 words per minute.

Break the ENTIRE script into visual segments (every 1-3 sentences, wherever the on-screen visual should change). For each segment provide:

- id: sequential integer starting at 1
- script_text: the exact sentences from the script (do not paraphrase)
- start_time and end_time: cumulative narration timing as "M:SS" strings
- search_terms: exactly 3 stock-footage search terms, ranked best first. Terms must be optimized for stock libraries like Pexels: simple, concrete, describing actions/settings/emotions ("man walking alone city night"), never abstract concepts ("loneliness of modern existence"). Prefer terms with high stock availability - avoid hyper-specific scenes that won't exist.
- clip_duration_seconds: integer estimate based on narration pace
- mood: one or two lowercase words (e.g., "hopeful", "tense", "warm")

Also provide:

- video_title_suggestion: a working title drawn from the script's theme
- estimated_runtime_seconds: total narration time as an integer

Cover the COMPLETE script start to finish. Never summarize, skip, or stop early.

Respond with ONLY a valid JSON object matching this structure. No markdown fences, no commentary, no preamble.
"""


def map_script(script: str) -> ShotList:
    """Map a script to a validated shot list."""
    return generate_json(SYSTEM_PROMPT, script, ShotList)
