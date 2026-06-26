"""Story Map response contracts: Pass 1 (entity scan) and Pass 2 (full map).

Schema-tolerant by design: extra keys the model invents are ignored (pydantic's
default), so a chatty model never crashes the parse. Every texture field is
optional and defaults to None so unsupported detail is omitted from the output
rather than padded with empty strings.
"""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

# The 3,000-word v1 cap message, shared by the router and the CLI so they speak
# with one voice.
CAP_MESSAGE = "Story Map v1 maps up to 3,000 words — try a chapter or excerpt."


class ImagineMode(str, Enum):
    """How the writer wants the fabrication engine to break the dead end."""

    seed = "seed"        # a small starter cast + threads, a springboard
    full = "full"        # a complete imagined map
    prompts = "prompts"  # generative questions, no invented people


class EntityScan(BaseModel):
    """Pass 1: just names, fast, to drive the live loading screen."""

    characters: list[str] = Field(default_factory=list)
    places: list[str] = Field(default_factory=list)


class Relationship(BaseModel):
    """How one character relates to another (by id), grounded in the text."""

    model_config = ConfigDict(populate_by_name=True)

    # "with" is a Python keyword, so the field is with_ with a "with" alias on
    # the wire (in from the model, out to the frontend).
    with_: str = Field(alias="with", description="id of the related character")
    type: str = "other"
    note: str = ""


class Texture(BaseModel):
    """Concrete, text-supported detail. Every field optional; the engine omits
    what the text does not support rather than inventing it."""

    appearance: str | None = None
    clothing: str | None = None
    habits: str | None = None
    routines: str | None = None
    notable_objects: str | None = None
    associated_places: str | None = None


class Character(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    role: str = "supporting"
    importance: int = 3  # 1-5; clamped in the engine, never validated away
    personality: str = ""
    arc: str = ""
    texture: Texture = Field(default_factory=Texture)
    relationships: list[Relationship] = Field(default_factory=list)


class StoryMap(BaseModel):
    """The full map. story_detected guards the MIRROR against fabrication - when
    it is false the UI shows 'no story to map here' instead of an invented cast.

    fabricated marks the INVENTED path: /map always returns fabricated=false
    (pure mirror), while the opt-in /imagine engine returns fabricated=true so
    'found' and 'imagined' can never be confused, in the data or in the UI."""

    story_detected: bool = False
    confidence: str = "low"  # high | medium | low
    note: str = ""
    fabricated: bool = False
    characters: list[Character] = Field(default_factory=list)


class StoryPrompt(BaseModel):
    """One generative question that opens a door for the writer."""

    question: str
    angle: str = ""  # a short note on why this question opens something up


class StoryPrompts(BaseModel):
    """The 'prompts' fabrication mode: questions, never invented characters.
    Always fabricated (it's a generative aid, not a reading of the text)."""

    fabricated: bool = True
    note: str = ""
    prompts: list[StoryPrompt] = Field(default_factory=list)
