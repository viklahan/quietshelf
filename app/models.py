"""Pydantic v2 request/response models. The response shape is the contract."""
from __future__ import annotations

from pydantic import BaseModel, Field


class MapRequest(BaseModel):
    script: str = Field(..., description="Full script text, 100-3000 words.")


class Segment(BaseModel):
    id: int
    script_text: str
    start_time: str
    end_time: str
    search_terms: list[str]
    clip_duration_seconds: int
    mood: str


class ShotList(BaseModel):
    video_title_suggestion: str
    estimated_runtime_seconds: int
    segments: list[Segment]
