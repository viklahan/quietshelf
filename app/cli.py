"""Quiet Shelf CLI (Typer + Rich): format, blurb, promote, themes, health.

Runs the services in-process using the same provider config as the server.
"""
from __future__ import annotations

import json
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from app import config
from app.providers import (
    JSONParseError,
    ProviderConfigError,
    ProviderError,
    validate_startup,
)
from app.services.blurb.extract import UnsupportedFormat as BlurbUnsupportedFormat
from app.services.blurb.extract import extract_text
from app.services.blurb.generator import generate_blurb
from app.services.blurb.models import Length, Tone
from app.services.format.converter import (
    EpubValidationError,
    UnsupportedFormat,
    convert_to_epub,
)
from app.services.format.models import Theme
from app.services.format.themes import THEMES
from app.services.promote.mapper import map_script
from app.services.storymap.engine import imagine_map, imagine_prompts, map_story
from app.services.storymap.models import CAP_MESSAGE, ImagineMode, StoryMap

app = typer.Typer(help="Quiet Shelf - turn a manuscript into finished, sellable things.", add_completion=False)
console = Console()
err = Console(stderr=True)


def _require_provider() -> None:
    try:
        validate_startup()
    except ProviderConfigError as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=1)


@app.command()
def themes() -> None:
    """List the available EPUB themes."""
    table = Table(title="Quiet Shelf themes")
    table.add_column("id", style="bold")
    table.add_column("name")
    table.add_column("description")
    for spec in THEMES.values():
        table.add_row(spec.id.value, spec.display_name, spec.description)
    console.print(table)


@app.command()
def health() -> None:
    """Show the configured provider and model."""
    console.print(f"provider: [bold]{config.provider_name()}[/bold]")
    console.print(f"model:    {config.model_name()}")


@app.command()
def format(
    manuscript: Path = typer.Argument(..., exists=True, readable=True),
    title: str = typer.Option(..., "--title"),
    author: str = typer.Option(..., "--author"),
    theme: Theme = typer.Option(Theme.classic, "--theme"),
    out: Path = typer.Option(None, "--out"),
) -> None:
    """Convert a manuscript (DOCX/RTF/TXT) into a themed EPUB."""
    out_path = out or manuscript.with_suffix(".epub")
    console.print(f"Formatting [bold]{manuscript.name}[/bold] with the '{theme.value}' theme...")
    try:
        convert_to_epub(source=manuscript, out_path=out_path, title=title, author=author, theme=theme)
    except UnsupportedFormat as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=1)
    except EpubValidationError:
        err.print("[red]error:[/red] We couldn't build a valid EPUB from that file. Try a DOCX export.")
        raise typer.Exit(code=2)
    except Exception:  # pandoc/Pillow/IO failures - never show a raw trace
        err.print("[red]error:[/red] Something went wrong converting that file. Check it opens in your word processor and try again.")
        raise typer.Exit(code=2)
    console.print(f"[green]Wrote[/green] {out_path}")


@app.command()
def blurb(
    manuscript: Path = typer.Argument(..., exists=True, readable=True),
    tone: Tone = typer.Option(Tone.literary, "--tone"),
    length: Length = typer.Option(Length.medium, "--length"),
    out: Path = typer.Option(None, "--out"),
) -> None:
    """Generate back-cover copy, taglines, and keywords from a manuscript."""
    _require_provider()
    try:
        text = extract_text(manuscript.read_bytes(), manuscript.suffix.lower())
    except BlurbUnsupportedFormat as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=1)
    console.print(f"Writing {tone.value} copy with {config.provider_name()}/{config.model_name()}...")
    try:
        result = generate_blurb(text, tone=tone, length=length)
    except (JSONParseError, ProviderError) as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=2)
    payload = result.model_dump()
    if out:
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        console.print(f"[green]Wrote[/green] {out}")
    else:
        console.print_json(data=payload)


@app.command()
def promote(
    script: Path = typer.Argument(..., exists=True, readable=True),
    out: Path = typer.Option(None, "--out"),
) -> None:
    """Map a script (plain text) into a stock-footage shot list."""
    _require_provider()
    text = script.read_text(encoding="utf-8", errors="ignore")
    word_count = len(text.split())
    if word_count < config.MIN_WORDS:
        err.print(f"[red]error:[/red] script too short - needs at least {config.MIN_WORDS} words (got {word_count}).")
        raise typer.Exit(code=1)
    if word_count > config.MAX_WORDS:
        err.print(f"[red]error:[/red] script too long ({word_count} words) - split it into parts.")
        raise typer.Exit(code=1)
    out_path = out or script.with_suffix(".shotlist.json")
    console.print(f"Mapping {word_count} words with {config.provider_name()}/{config.model_name()}...")
    try:
        shot_list = map_script(text)
    except (JSONParseError, ProviderError) as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=2)
    out_path.write_text(json.dumps(shot_list.model_dump(), indent=2, ensure_ascii=False), encoding="utf-8")
    console.print(f"[green]Wrote[/green] {out_path} ({len(shot_list.segments)} segments)")


def _print_story(story: StoryMap) -> None:
    """Print a readable summary of the map to the terminal."""
    if not story.story_detected or not story.characters:
        console.print("[yellow]We couldn't find a story to map in this document.[/yellow]")
        if story.note:
            console.print(f"[dim]{story.note}[/dim]")
        return

    banner = "[magenta]Imagined story[/magenta]" if story.fabricated else "[bold green]Story detected[/bold green]"
    console.print(f"{banner}  (confidence: {story.confidence})")
    if story.note:
        console.print(f"[dim]{story.note}[/dim]")

    chars = Table(title="Characters")
    chars.add_column("id", style="bold")
    chars.add_column("name")
    chars.add_column("role")
    chars.add_column("imp.", justify="right")
    chars.add_column("personality")
    chars.add_column("arc")
    for ch in story.characters:
        chars.add_row(ch.id, ch.name, ch.role, str(ch.importance), ch.personality, ch.arc or "-")
    console.print(chars)

    name_by_id = {c.id: c.name for c in story.characters}
    rels = Table(title="Relationships")
    rels.add_column("from")
    rels.add_column("type")
    rels.add_column("with")
    rels.add_column("note")
    rows = 0
    for ch in story.characters:
        for rel in ch.relationships:
            rels.add_row(ch.name, rel.type, name_by_id.get(rel.with_, rel.with_), rel.note)
            rows += 1
    if rows:
        console.print(rels)
    else:
        console.print("[dim]No relationships grounded in the text.[/dim]")


@app.command()
def storymap(
    manuscript: Path = typer.Argument(..., exists=True, readable=True),
    out: Path = typer.Option(None, "--out"),
) -> None:
    """Map a manuscript (DOCX/RTF/TXT) into characters and relationships."""
    _require_provider()
    try:
        text = extract_text(manuscript.read_bytes(), manuscript.suffix.lower())
    except BlurbUnsupportedFormat as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=1)
    words = len(text.split())
    if words == 0:
        err.print("[red]error:[/red] no text found in that file.")
        raise typer.Exit(code=1)
    if words > config.MAX_WORDS:
        err.print(f"[red]error:[/red] {CAP_MESSAGE}")
        raise typer.Exit(code=1)
    console.print(f"Mapping {words} words with {config.provider_name()}/{config.model_name()}...")
    # Per spec: on failure, surface the real error (full traceback) - never
    # swallow it. So the engine call is deliberately not wrapped.
    story = map_story(text)
    _print_story(story)
    if out:
        payload = story.model_dump(by_alias=True, exclude_none=True)
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        console.print(f"[green]Wrote[/green] {out}")


@app.command()
def imagine(
    manuscript: Path = typer.Argument(..., exists=True, readable=True),
    mode: ImagineMode = typer.Option(ImagineMode.seed, "--mode"),
    nudge: str = typer.Option("", "--nudge", help="A premise/genre/tone steer."),
    reroll: bool = typer.Option(False, "--reroll", help="Ask for a fresh, different take."),
    out: Path = typer.Option(None, "--out"),
) -> None:
    """Imagine a story from any material (the opt-in fabrication door).

    Modes: seed (starter cast), full (complete imagined map), prompts
    (generative questions). Everything produced is invented, not found.
    """
    _require_provider()
    try:
        text = extract_text(manuscript.read_bytes(), manuscript.suffix.lower())
    except BlurbUnsupportedFormat as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=1)
    words = len(text.split())
    if words == 0:
        err.print("[red]error:[/red] no text found to imagine from.")
        raise typer.Exit(code=1)
    if words > config.MAX_WORDS:
        err.print(f"[red]error:[/red] {CAP_MESSAGE}")
        raise typer.Exit(code=1)
    console.print(f"Imagining ([magenta]{mode.value}[/magenta]) from {words} words with {config.provider_name()}/{config.model_name()}...")
    # Per spec: on failure, surface the real error (full traceback) - never swallow.
    if mode is ImagineMode.prompts:
        result = imagine_prompts(text, nudge=nudge, reroll=reroll)
        console.print("[magenta]Imagined prompts[/magenta]")
        if result.note:
            console.print(f"[dim]{result.note}[/dim]")
        table = Table(title="Prompts")
        table.add_column("#", style="bold", justify="right")
        table.add_column("question")
        table.add_column("angle", style="dim")
        for i, p in enumerate(result.prompts, start=1):
            table.add_row(str(i), p.question, p.angle or "-")
        console.print(table)
        payload = result.model_dump(by_alias=True, exclude_none=True)
    else:
        story = imagine_map(text, mode, nudge=nudge, reroll=reroll)
        _print_story(story)
        payload = story.model_dump(by_alias=True, exclude_none=True)
    if out:
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        console.print(f"[green]Wrote[/green] {out}")


if __name__ == "__main__":
    app()
