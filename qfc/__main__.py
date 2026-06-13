"""CLI mode: run the same mapping from the terminal, no frontend needed.

Usage:
    python -m qfc map script.txt --out shotlist.json

Writes the JSON shot list plus a human-readable markdown table next to it.
Uses the same provider config as the server: set LLM_PROVIDER and the matching
key/host in the environment or a .env file (see .env.example).
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

from app import config
from app.mapping import MappingError, map_script
from app.models import ShotList
from app.providers import (
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
    validate_startup,
)


def _markdown_table(shot_list: ShotList) -> str:
    lines = [
        f"# {shot_list.video_title_suggestion}",
        "",
        f"Estimated runtime: **{shot_list.estimated_runtime_seconds}s** "
        f"(~{shot_list.estimated_runtime_seconds / 60:.1f} min) - "
        f"{len(shot_list.segments)} segments",
        "",
        "| # | Time | Script | Search terms | Clip (s) | Mood |",
        "|---|------|--------|--------------|----------|------|",
    ]
    for seg in shot_list.segments:
        script = seg.script_text.replace("|", "\\|").replace("\n", " ")
        terms = "<br>".join(t.replace("|", "\\|") for t in seg.search_terms)
        lines.append(
            f"| {seg.id} | {seg.start_time}-{seg.end_time} | {script} "
            f"| {terms} | {seg.clip_duration_seconds} | {seg.mood} |"
        )
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    parser = argparse.ArgumentParser(prog="qfc", description="Quiet Fight Club CLI")
    sub = parser.add_subparsers(dest="command", required=True)
    map_cmd = sub.add_parser("map", help="Map a script file to a shot list")
    map_cmd.add_argument("script", type=Path, help="Path to a plain-text script file")
    map_cmd.add_argument("--out", type=Path, default=None, help="Output JSON path (default: <script>.shotlist.json)")
    args = parser.parse_args(argv)

    if not args.script.is_file():
        print(f"error: script file not found: {args.script}", file=sys.stderr)
        return 1

    try:
        provider = validate_startup()
    except ProviderConfigError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    script_text = args.script.read_text(encoding="utf-8")
    word_count = len(script_text.split())
    if word_count < config.MIN_WORDS:
        print(f"error: script too short - needs at least {config.MIN_WORDS} words (got {word_count})", file=sys.stderr)
        return 1
    if word_count > config.MAX_WORDS:
        print(f"error: script too long ({word_count} words) - split it into parts", file=sys.stderr)
        return 1

    out_path: Path = args.out or args.script.with_suffix(".shotlist.json")
    print(f"Mapping {word_count} words with {provider.name}/{config.model_name()}...")

    try:
        shot_list = map_script(script_text)
    except MappingError:
        print("error: the mapping engine returned an unreadable result twice. Try again.", file=sys.stderr)
        return 2
    except ProviderRateLimited:
        print("error: the free AI tier needs a breather. Try again in a minute.", file=sys.stderr)
        return 3
    except ProviderTimeout:
        print("error: the mapping call took too long (over 120 seconds). Try a shorter script.", file=sys.stderr)
        return 3
    except ProviderError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 3

    out_path.write_text(json.dumps(shot_list.model_dump(), indent=2, ensure_ascii=False), encoding="utf-8")
    md_path = out_path.with_suffix(".md")
    md_path.write_text(_markdown_table(shot_list), encoding="utf-8")

    print(f"Wrote {out_path} and {md_path} ({len(shot_list.segments)} segments, ~{shot_list.estimated_runtime_seconds}s runtime)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
