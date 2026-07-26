"""Format request/response models and the Theme enum."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class Theme(str, Enum):
    classic = "classic"
    cozy = "cozy"
    modern = "modern"
    children = "children"


class CoverStyle(str, Enum):
    """Generated-cover looks. Unknown values fall back to quiet in cover.py -
    a cover option must never fail the format call."""

    quiet = "quiet"
    frame = "frame"
    wash = "wash"
    band = "band"


class ThemeInfo(BaseModel):
    id: Theme
    display_name: str
    description: str


class ThemeList(BaseModel):
    themes: list[ThemeInfo]
