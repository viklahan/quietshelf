"""Format request/response models and the Theme enum."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class Theme(str, Enum):
    classic = "classic"
    cozy = "cozy"
    modern = "modern"
    children = "children"


class ThemeInfo(BaseModel):
    id: Theme
    display_name: str
    description: str


class ThemeList(BaseModel):
    themes: list[ThemeInfo]
