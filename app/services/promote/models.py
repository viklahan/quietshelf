"""Promote response contract."""
from __future__ import annotations

from pydantic import BaseModel, Field


class PromoteRequest(BaseModel):
    script: str = Field(..., description="Full script text, 100-3000 words.")


class Segment(BaseModel):
    id: int
    script_text: str
    start_time: str
    end_time: str
    search_terms: list[str] = Field(..., min_length=3, max_length=3)
    clip_duration_seconds: int
    mood: str


class ShotList(BaseModel):
    video_title_suggestion: str
    estimated_runtime_seconds: int
    segments: list[Segment]
