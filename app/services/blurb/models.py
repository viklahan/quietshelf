"""Blurb request options and the response contract."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, model_validator


class Tone(str, Enum):
    literary = "literary"
    punchy = "punchy"
    warm = "warm"
    mysterious = "mysterious"


class Length(str, Enum):
    short = "short"
    medium = "medium"
    full = "full"


class BlurbRequest(BaseModel):
    text: str | None = Field(None, description="Pasted manuscript text (or upload a file).")
    tone: Tone = Tone.literary
    length: Length = Length.medium


class BlurbResult(BaseModel):
    # The LLM emits back_cover_variants; back_cover is backfilled from the
    # first variant so old clients keep working without generating text twice.
    back_cover: str = ""
    back_cover_variants: list[str] = Field(default_factory=list)
    taglines: list[str] = Field(..., min_length=3, max_length=3)
    short_description: str
    keywords: list[str]
    query_paragraph: str | None = None
    comps: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def _backfill_back_cover(self):
        if not self.back_cover and self.back_cover_variants:
            self.back_cover = self.back_cover_variants[0]
        if not self.back_cover:
            raise ValueError("back_cover or back_cover_variants is required")
        return self
