# Quiet Shelf — Backend Handoff (for Claude Code)

The UI in `static/` (this folder) now sends three new inputs and renders four new
outputs. Everything is **backward compatible**: the frontend works unchanged against
the current API and lights up each feature as the backend starts providing it.

---

## 1 · Format — generated-cover looks

**What the UI does:** when no cover image is uploaded, the writer picks a cover
*look* and *accent*; the payoff book previews it exactly. `api.js` appends two new
multipart fields to `POST /api/format` (only when `cover_image` is absent):

| Field | Values | Default |
| --- | --- | --- |
| `cover_style` | `quiet` \| `frame` \| `wash` \| `band` | `quiet` |
| `cover_accent` | hex string, e.g. `#7e2b23` | the theme's ink |

**What to build (`cover.py`):** extend `_PALETTE`-based generation with four layouts.
All use the existing theme palette (`bg` = page, `ink` = text) + `accent`:

- `quiet` — current design: `bg` field, short `accent` rule above the title, title in
  `ink` upper third, author small at bottom. (Today's output = `quiet` with `accent = ink`.)
- `frame` — `bg` field; double rectangular border inset from the edge (outer ~1.5%
  of width in `accent`, inner thinner at 40% opacity); title centered.
- `wash` — vertical gradient from `mix(accent 34%, bg)` at the top to `bg` by ~60%
  height; otherwise like `quiet`.
- `band` — `bg` field with a full-width horizontal `accent` band from 28%–54% of the
  height; title centered **inside the band in `bg` color**; no rule; author at bottom in `ink`.

Theme palette (already in cover.py — unchanged):
`classic #f4f0e8/#28221c · cozy #f7f1ee/#3c2e2e · modern #fafafa/#18181c · children #fff8e6/#2c3e50`

Frontend accent set (validate against, but accept any hex):
`#7e2b23` (oxblood) · `#2e4257` (harbor) · `#2f5040` (fir) · theme ink (default).

Per-theme title typography on the generated cover should match the theme faces the
UI previews: classic = serif, centered; cozy = softer serif; modern = uppercase,
letterspaced, left-aligned; children = larger, centered.

Unknown/missing fields ⇒ fall back to `quiet` + ink. Never fail the format call
over a cover option.

## 2 · Blurb — one call, richer response

`POST /api/blurb` already receives `tone` and `length`. The UI now lets the writer
set `length` = `short` | `medium` | `full` (was always `medium`).

**Extend the response JSON** (one LLM call — do NOT fan out to multiple requests;
the free tier's daily cap is the budget):

```json
{
  "back_cover": "…",                      // keep: first variant, for old clients
  "back_cover_variants": ["…", "…", "…"], // NEW: 2–3 distinct takes, same tone/length
  "taglines": ["…"],
  "short_description": "…",
  "keywords": ["…"],
  "query_paragraph": "…",                 // NEW: one query-letter paragraph (agent-facing;
                                          //   title, word count if known, hook, comps)
  "comps": ["Title — Author", "…"]        // NEW: 2–3 comp titles as single strings
}
```

Frontend behavior per field (all optional):
- `back_cover_variants` absent/empty → single take, no Take 01/02/03 switcher.
- `query_paragraph` absent → card not rendered.
- `comps` absent/empty → card not rendered. When present the writer can edit them
  in place (display-only; edits are not sent back).

Suggested prompt note: variants must genuinely differ in angle (e.g. character-led /
mood-led / hook-led), not be paraphrases.

## 3 · Blurb — kept blurbs (no backend work)

Saved entirely in `localStorage` under `qs.blurb.kept` (max 12, whole result +
tone/length/timestamp). Listed on the compose screen with Open/Remove. FYI only —
no endpoint needed, consistent with "no storage" on the server.

## 4 · Rate-limit framing (unchanged)

No new endpoints, no extra calls per click: Format stays non-AI; Blurb remains one
request per run. The richer Blurb response costs more output tokens per run — if the
free tier squeaks, trim `back_cover_variants` to 2 before cutting anything else.

## Logo (new brand asset)

Production already loads the mark from `/static/assets/logo-mark.svg` (header <img> in `app.jsx` line ~57, favicon in `index.html`). The new mark is a **content drop-in at that same path** — copy `ui-refresh/static/assets/logo-mark.svg` over it; no template or CSS changes required. Header and favicon update together.

The mark: three book spines on a shelf, the leaning one ember; titles read The / Quiet / Shelf, knocked out of the shapes so the page background shows through. Colors baked for the dark UI (paper #ede4d3, ember #c5893b).

Optional polish:
- The new viewBox is 48:42 (wider than tall). The header <img> is 26×26, which letterboxes slightly — change to `width="26" height="23"` for a tighter fit.
- `static/assets/logo-mark.png` (and `frontend/data/QSlogo.png`) still show the old inkpot art — re-export from the new SVG if anything serves the PNG (emails, social cards, ePUB back matter).
- On light surfaces set spine fills to ink #15110d and ember #9c6a26. Canonical adaptive source (currentColor + `--logo-accent`): design system `assets/logo.svg`.

## Windows dev fix — requirements.txt (server won't start)

`requirements.txt` is a Linux pip-freeze; `uvloop` has no Windows support, so a fresh `.venv` on Windows fails during install and the .bat aborts. Add platform markers:

```
uvloop==0.22.1; sys_platform != "win32"
httptools==0.8.0; sys_platform != "win32"
```

Prod (Linux) resolves identically; Windows skips both (plain uvicorn needs neither). Then delete `.venv` and re-run `Start Quiet Shelf.bat`.

## MISSING MODULE — cover_suggestions.py (prod 500 + local startup failure)

`app/services/format/router.py` line 20 imports `app.services.format.cover_suggestions`, but that module was never committed. Effects: local uvicorn dies at import (ModuleNotFoundError — this is the "server won't start"); prod POST /api/format/cover-suggestions returns 500.

Fix: copy `ui-refresh/app/services/format/cover_suggestions.py` into the repo at that same path. It implements the api.js contract `{suggestions: [{url, thumb_url, photographer, source, search_term}]}`: LLM (generate_json) extracts 3 visual search terms with a no-AI title-keyword fallback, then a portrait-photo waterfall Unsplash → Pexels → Pixabay (existing config accessors; each skipped when keyless). Interleaves one photo per term, dedupes, caps at n=5. Never raises — worst case `{"suggestions": []}`, and the UI already treats that as optional.

Env: prod needs UNSPLASH_ACCESS_KEY / PEXELS_API_KEY / PIXABAY_API_KEY in `/root/quietshelf/.env` (any subset works).

Deploy: commit + push, then `cd /root/quietshelf && git pull && systemctl restart quietshelf`.
