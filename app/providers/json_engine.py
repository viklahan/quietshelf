"""Shared defensive JSON generation: call the provider, parse, retry once.

Blurb and Promote both call generate_json. This is the only place the
parse/retry logic lives. Secrets and content are never logged - only counts.
"""
from __future__ import annotations

import json
import logging
import re
import time
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from app.providers.registry import get_provider

logger = logging.getLogger("quietshelf.json_engine")

T = TypeVar("T", bound=BaseModel)

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)

RETRY_INSTRUCTION = (
    "\n\nIMPORTANT: Your previous response could not be parsed. "
    "Respond with ONLY a single valid JSON object - no markdown fences, "
    "no commentary, no text before or after the JSON."
)


class JSONParseError(Exception):
    """The model returned an unparseable result twice in a row."""


def _extract_json(raw: str) -> dict:
    """Strip markdown fences / surrounding chatter and parse the JSON object."""
    text = _FENCE_RE.sub("", raw).strip()
    if not text.startswith("{"):
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("no JSON object found in model output")
        text = text[start : end + 1]
    return json.loads(text)


def generate_json(system_prompt: str, user_content: str, model: type[T]) -> T:
    """Generate JSON matching `model`. Retries once on unparseable output;
    raises JSONParseError if it fails twice."""
    started = time.monotonic()
    for attempt, retry in enumerate((False, True), start=1):
        system = system_prompt + RETRY_INSTRUCTION if retry else system_prompt
        raw = get_provider().generate(system, user_content, json_mode=True)
        try:
            result = model.model_validate(_extract_json(raw))
        except (ValueError, ValidationError) as exc:
            logger.warning("parse_failed attempt=%d error=%s", attempt, type(exc).__name__)
            continue
        logger.info(
            "generate_json_ok model=%s duration_ms=%d attempt=%d",
            model.__name__,
            int((time.monotonic() - started) * 1000),
            attempt,
        )
        return result
    raise JSONParseError("model output was unparseable after one retry")
