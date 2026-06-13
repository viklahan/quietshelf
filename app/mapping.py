"""Core mapping engine: call the configured provider, parse defensively,
retry once.

Secrets and script content are never logged - only word counts and timing.
"""
from __future__ import annotations

import json
import logging
import re
import time

from pydantic import ValidationError

from app.models import ShotList
from app.prompt import RETRY_INSTRUCTION, SYSTEM_PROMPT
from app.providers import get_provider

logger = logging.getLogger("qfc.mapping")

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


class MappingError(Exception):
    """The model returned an unparseable result twice in a row."""


def _call_model(script: str, retry: bool = False) -> str:
    """One provider call. Returns the raw text of the response."""
    system = SYSTEM_PROMPT + RETRY_INSTRUCTION if retry else SYSTEM_PROMPT
    return get_provider().generate_mapping(script, system=system)


def _extract_json(raw: str) -> dict:
    """Strip markdown fences / surrounding chatter and parse the JSON object."""
    text = _FENCE_RE.sub("", raw).strip()
    # Fall back to the outermost braces in case the model added commentary.
    if not text.startswith("{"):
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("no JSON object found in model output")
        text = text[start : end + 1]
    return json.loads(text)


def map_script(script: str) -> ShotList:
    """Map a script to a validated shot list. Retries the provider call once on
    unparseable output; raises MappingError if it fails twice."""
    word_count = len(script.split())
    started = time.monotonic()

    for attempt, retry in enumerate((False, True), start=1):
        raw = _call_model(script, retry=retry)
        try:
            shot_list = ShotList.model_validate(_extract_json(raw))
        except (ValueError, ValidationError) as exc:
            logger.warning(
                "parse_failed attempt=%d word_count=%d error=%s",
                attempt,
                word_count,
                type(exc).__name__,
            )
            continue
        logger.info(
            "mapping_complete word_count=%d segments=%d duration_ms=%d attempt=%d",
            word_count,
            len(shot_list.segments),
            int((time.monotonic() - started) * 1000),
            attempt,
        )
        return shot_list

    raise MappingError("model output was unparseable after one retry")
