"""Blurb request options and the response contract."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class Tone(str, Enum):
    literary = "literary"
    punchy = "punchy"
    warm = "warm"
    mysterious = "mysterious"


class Length(str, Enum):
    short = "short"
    medium = "medium"


class BlurbRequest(BaseModel):
    text: str | None = Field(None, description="Pasted manuscript text (or upload a file).")
    tone: Tone = Tone.literary
    length: Length = Length.medium


class BlurbResult(BaseModel):
    back_cover: str
    taglines: list[str] = Field(..., min_length=3, max_length=3)
    short_description: str
    keywords: list[str]
