# Quiet Shelf — Backend + CLI (Phase 1) — Design Spec

**Date:** 2026-06-20
**Status:** Approved for planning
**Scope:** Backend + CLI only. Frontend is deferred until after the Format service is validated via CLI on a real DOCX.

## What this is

Quiet Shelf is a writer's toolkit: hand over a manuscript, get back finished, sellable, promotable artifacts. Phase 1 ships three independent services under one FastAPI app and one deploy:

1. **Format** (hero) — manuscript (DOCX/RTF/TXT) → beautifully typeset, themed EPUB.
2. **Blurb** — manuscript → back-cover copy, taglines, store-listing text.
3. **Promote** — written piece → stock-footage shot list for a promo video.

Free and open-source. **No paid AI providers.** LLM work runs only on free-tier / open models: Gemini free tier (default), Groq free tier, or local Ollama. The provider layer is pluggable. Format needs no LLM at all.

## Strategy: in-place restructure

This repository already contains a working Promote backend (formerly "Quiet Fight Club") with a complete provider layer, defensive JSON parsing, rate limiting, access-code gating, and a frontend design-token system. We **restructure this repo in place** into the Quiet Shelf layout — reusing the provider layer and Promote engine, generalizing the provider interface, and adding Format and Blurb. Git history, frontend tokens, and the deploy are preserved.

## Architecture principle

Each of the three services is a clean, self-contained module. **The three `services/*` packages never import from each other.** Any tab can later be paywalled, metered, or spun into its own product without surgery. Shared code lives only in `app/providers/` (the LLM abstraction) and in app-level infrastructure (`config.py`, `deps.py`, `ratelimit.py`) which is not service-to-service coupling.

## Target tree

```
app/
  main.py            FastAPI: mounts 3 routers, serves frontend, CORS, lifespan provider check, health
  config.py          extended env/settings (lazy, env-driven)
  deps.py            app-level FastAPI deps: access-code check, rate-limit check, client-IP resolution
  ratelimit.py       in-memory per-IP limiter (kept from current repo)
  cli.py             Typer + Rich CLI exposing all three services + themes/health
  providers/         SHARED LLM layer (used by blurb + promote only)
    __init__.py      get_provider(), validate_startup()
    base.py          Provider ABC: generate(system_prompt, user_content, json_mode=True) -> str; error types
    gemini.py        GeminiProvider (default), gemini-2.5-flash, native JSON mode
    groq.py          GroqProvider, llama-3.3-70b-versatile, JSON mode
    ollama.py        OllamaProvider, local, format:"json"
    json_engine.py   generate_json(system, user, Model): strip fences, validate against Pydantic, retry once, clean error
  services/
    format/          NO LLM
      router.py      POST /api/format, GET /api/format/themes
      converter.py   the EPUB pipeline
      cover.py       typographic cover generation (Pillow)
      models.py      Pydantic models, Theme enum
      themes/        theme definitions + CSS + embedded OFL fonts
    blurb/
      router.py      POST /api/blurb
      generator.py   baked-in system prompt + generate_json call
      extract.py     docx/rtf/txt -> plain text + representative sampling
      models.py
    promote/         migrated from current app/{mapping,prompt,models}.py
      router.py      POST /api/promote
      mapper.py      baked-in visual-mapping prompt + generate_json call
      models.py      ShotList / Segment
tests/               pytest
Dockerfile           python-slim + pandoc + fonts, non-root, PORT env
docker-compose.yml   single quiet-shelf service
.env.example
README.md
```

## Provider layer (refactor)

The current interface is Promote-specific: `generate_mapping(script, system) -> str`. Generalize to:

```
generate(system_prompt: str, user_content: str, json_mode: bool = True) -> str
```

Split the single `app/providers.py` into the `app/providers/` package above. Carry over unchanged:

- Provider selection by `LLM_PROVIDER` env (default `gemini`).
- Startup validation: a missing key/host raises `ProviderConfigError` naming the free source, aborting startup.
- Error taxonomy: `ProviderConfigError`, `ProviderError`, `ProviderRateLimited`, `ProviderTimeout`.
- 429 handling surfaced as the friendly "the free AI tier needs a breather" message.

**`json_engine.generate_json(system, user, Model)`** centralizes the defensive parse currently inside `mapping.py`: strip markdown fences / surrounding chatter, locate the outermost JSON object, `Model.model_validate(...)`, retry once with a stricter instruction on failure, and raise a clean error (→ 502) after a second failure. Both Blurb and Promote call this. This is the only place the parse/retry logic exists.

Provider models (defaults, override via `MODEL_NAME`):
- Gemini: `gemini-2.5-flash`
- Groq: `llama-3.3-70b-versatile`
- Ollama: `qwen2.5:latest` (8B-class floor for reliable JSON)

## Service 1 — Format (hero, no LLM)

**Endpoints**
- `POST /api/format` — multipart: `file` (DOCX/RTF/TXT), `title`, `author`, `theme` (enum), optional `cover_image`. Returns `.epub` download.
- `GET /api/format/themes` — list themes with display names + descriptions.

**`converter.py` pipeline**
1. Accept DOCX (primary), RTF, TXT. Reject other extensions with a clear, friendly message.
2. **Pandoc** converts source → EPUB directly (Pandoc natively reads DOCX/RTF/TXT/markdown), preserving structure: headings→chapters, bold/italic, blockquotes, lists, embedded images.
3. Apply the chosen theme: inject custom CSS + embed the theme's OFL font into the EPUB.
4. Generate proper EPUB metadata: title, author, language, unique id (uuid).
5. Build a navigable TOC from headings.
6. Cover: if `cover_image` supplied, embed it; otherwise generate an elegant typographic cover (see below). Every book gets a cover.
7. Insert front matter: title page + auto copyright page (current year + author).
8. Validate the EPUB is well-formed before returning; friendly error if invalid.
9. Clean up all temp files after the conversion (success or failure).

TXT has no structure: treat blank lines as paragraph breaks and lean on the theme.

**Themes (4 at launch; all OFL, free for commercial use — licenses verified before vendoring):**

| Theme | Font | Source |
|---|---|---|
| Classic Literary (warm serif) | EB Garamond | vendor (OFL) |
| Cozy (soft, gentle serif) | Newsreader | already vendored in repo (OFL) |
| Modern Clean (crisp humanist serif) | Source Serif 4 | already vendored in repo (OFL) |
| Children's (rounded, friendly) | Quicksand (or Andika) | vendor (OFL) |

Each theme's CSS controls body font/size/line-height, heading style, chapter-break treatment, margins, drop-cap, and indent-vs-spaced paragraphs. Goal: a plain manuscript comes out looking professionally typeset — better than the writer's Word original.

**Decided defaults (approved):**
- **Cover generation → Pillow.** When no cover is supplied, render a themed typographic cover PNG (title + author on a themed background). Adds the `Pillow` dependency.
- **EPUB validation → lightweight, no epubcheck.** Full `epubcheck` requires a Java runtime — too heavy for the container. Validate structurally instead: the output is a valid zip with the correct uncompressed `mimetype` entry, a parseable `META-INF/container.xml`, and a parseable OPF. Documented honest caveat; epubcheck can be added later for strict EPUB3 conformance.

**Honest constraints encoded in docs/UX:** EPUB is reflowable — we preserve structure, styling, images, and embedded fonts, not pixel-perfect layout. E-readers may override embedded fonts; we embed anyway and document the caveat.

## Service 2 — Blurb (LLM)

**Endpoint** `POST /api/blurb` — accepts pasted text or an uploaded file (DOCX/RTF/TXT). Options: `tone` (literary/punchy/warm/mysterious), `length` (short/medium).

- `extract.py` pulls plain text: **python-docx** for DOCX, **striprtf** for RTF, raw decode for TXT. For a full manuscript, extract a representative sample (opening + a middle chunk) to stay within token limits.
- `generator.py` holds the baked-in system prompt: infer genre/tone/audience and produce the copy. **Must not** invent plot points, spoilers, quotes, or reviews not grounded in the text. Calls `providers.json_engine.generate_json`.

**Response (`BlurbResult`)**: `back_cover` (~100–150 words), `taglines` (3), `short_description` (~50 words), `keywords` (genre/category suggestions).

## Service 3 — Promote (migrated, behavior unchanged)

**Endpoint** `POST /api/promote` — JSON `{script: "100-3000 words"}`. The current `/api/map` endpoint is renamed to `/api/promote` per spec. Word-count validation (422 when out of range), retry, and friendly failures are retained exactly.

The existing visual-mapping system prompt, `ShotList`/`Segment` models, and mapping logic move into `services/promote/` and call `generate_json`. Response: `video_title_suggestion`, `estimated_runtime_seconds`, `segments[]` each with `id`, `script_text` (exact, no paraphrase), `start_time`/`end_time` ("M:SS", cumulative), `search_terms` (exactly 3, ranked best-first, concrete and high-availability), `clip_duration_seconds`, `mood` (1–2 lowercase words). Covers the complete text; never summarizes or stops early; responds with valid JSON only. The frontend turns each search term into a Pexels URL: `https://www.pexels.com/search/videos/{url-encoded term}/`.

## Cross-cutting

- **Config (`.env.example`)**: `LLM_PROVIDER` (gemini|groq|ollama), `GEMINI_API_KEY`, `GROQ_API_KEY`, `OLLAMA_HOST`, `MODEL_NAME` (optional override), `ACCESS_CODE` (optional; if set, requests need `X-Access-Code`), `ALLOWED_ORIGINS=*`, `RATE_LIMIT=20/hour`, `MAX_UPLOAD_MB=25`. Default rate limit bumped from 10 to 20.
- **`deps.py`**: FastAPI dependencies for access-code check, rate-limit check, and client-IP resolution (honoring `x-forwarded-for`), shared across routers. This is app infrastructure, not cross-service import.
- **Logging**: never log manuscript content or keys. Log counts, timings, theme names, provider name only.
- **Friendly failure everywhere**: a stressed writer never sees a raw stack trace. Upstream/parse/timeout/rate-limit all map to clean JSON errors with human messages.
- **Type hints + Pydantic v2 everywhere.**

## Dependencies

Existing: `fastapi`, `uvicorn[standard]`, `pydantic`, `python-dotenv`, `google-genai`, `groq`, `httpx`.
Added: `pypandoc-binary` (or subprocess invocation of system `pandoc`), `python-docx`, `striprtf`, `Pillow`, `typer`, `rich`.
System (Dockerfile): `pandoc` + the four vendored theme fonts.

## CLI (`app/cli.py`, Typer + Rich)

```
quiet-shelf format manuscript.docx --title "My Stories" --author "Name" --theme cozy --out book.epub
quiet-shelf blurb manuscript.docx --tone warm
quiet-shelf promote script.txt --out shotlist.json
quiet-shelf themes
quiet-shelf health
```

The CLI calls the service modules directly (in-process), not the HTTP API. A `quiet-shelf` console-script entry point is registered. The existing `qfc/` CLI is replaced by this.

## Docker

- **Dockerfile**: `python:3.12-slim`, install `pandoc` and theme fonts, install requirements, copy `app/` + `static/`, non-root user, serve frontend static from FastAPI, port from `PORT` env (default 8000).
- **docker-compose.yml**: single `quiet-shelf` service. Ollama is referenced by URL if used (not bundled).

## README

One warm paragraph (for writers); run-it-free quickstart (clone → free Gemini key → `docker compose up` → localhost:8000); the three services explained simply; the honest reflowable-EPUB note; self-host-with-Ollama for offline/private use; MIT license.

## Tests (pytest)

- **Format**: convert a sample DOCX and assert a valid EPUB is produced (structural validation passes; metadata + at least one chapter + embedded font present).
- **Blurb**: JSON parsing with a mocked provider (valid output validates; fenced/chatty output is recovered; second failure → clean 502).
- **Promote**: word-count validation (422 boundaries) + parsing (existing tests adapted to new module paths).

## Out of scope (Phase 1)

No accounts, billing, tiers, Cover tab (deferred to v2 as AI cover generation), PDF input, publishing/KDP integration, or database. Frontend is built after Format is validated via CLI on a real DOCX.

## Build order (parallelizable)

The three services are independent. Natural split for parallel agents:
- **A** — providers refactor (package split + generic `generate` + `json_engine`) and Promote migration. Unblocks C.
- **B** — Format service (fully independent; can start immediately).
- **C** — Blurb service (depends on A's `json_engine`).
- Wire `main.py`, `cli.py`, Dockerfile, `.env.example`, README, and tests last.
