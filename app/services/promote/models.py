"""Promote response contract."""
from __future__ import annotations

from pydantic import BaseModel, Field


class PromoteRequest(BaseModel):
    script: str = Field(..., description="Full script text, 100-3000 words.")
    # Optional Story Map attachment (the raw map JSON the writer saved). The
    # router validates it against the StoryMap contract; dict here keeps the
    # wire format decoupled from the storymap module.
    story_map: dict | None = None


class Segment(BaseModel):
    id: int
    script_text: str
    start_time: str
    end_time: str
    search_terms: list[str] = Field(..., min_length=3, max_length=8)
    clip_duration_seconds: int
    mood: str


class ShotList(BaseModel):
    video_title_suggestion: str
    estimated_runtime_seconds: int
    segments: list[Segment]


# --- per-chunk mapping ----------------------------------------------------
# The script is mapped one bounded excerpt at a time. Each chunk returns just
# its segments (no global start/end times - those are computed cumulatively
# while stitching, which the model is unreliable at and would only slow down).
class ChunkSegment(BaseModel):
    script_text: str
    search_terms: list[str] = Field(..., min_length=3, max_length=8)
    clip_duration_seconds: int
    mood: str


class ChunkResult(BaseModel):
    video_title_suggestion: str = ""
    segments: list[ChunkSegment]
