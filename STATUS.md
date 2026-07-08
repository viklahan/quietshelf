# Quiet Shelf — STATUS

_Continuity doc. Last updated 2026-07-08. Read this first on any return._

## Where it stands: v1, verified, paused

Four services work, are hardened, and were driven end-to-end on real hardware.
Work is **paused** here to focus on Pelco Validate (team demo took priority).
This is a clean stopping point — nothing is half-built.

Branch: `quiet-shelf-restructure`. **Push to a private remote is the one open
task** (GitHub auth being sorted separately). Everything below is committed.

## The four tabs (all verified live)

| Tab | What it does | Last verified |
|---|---|---|
| **Format** | DOCX/RTF/TXT → themed EPUB. **No AI.** | DOCX→EPUB 1.7s, valid EPUB, 4 themes (classic/cozy/modern/children) |
| **Blurb** | Manuscript → back-cover copy, taglines, keywords | Live on Groq; grounding + kept-draft verified |
| **Promote** | Writing → stock-footage shot list | Live on Groq, 8 segments; anchor terms + clip memory verified |
| **Story Map** | Manuscript → character/relationship map (a mirror; opt-in Imagine invents, always stamped) | Full Playwright pass: map, empty-map door, seed + prompts imagine |

## What this session built (2026-07-06 → 07-08)

- **The map is the pipeline.** Save a Story Map, then ground Blurb and Promote
  with it (confirmed cast = shared truth). Found maps ground by default;
  imagined maps opt-in only; the "imagined" stamp travels into prompts and back
  onto results. Bad map attachment → clean 422, never a silent un-grounded run.
- **Clip consistency (Promote).** Each character gets a deterministic anchor
  search term (from their map texture) prepended to every segment they appear
  in, so the same person keeps the same footage. Found-clip links are kept per
  character and ride inside the saved map file.
- **Writer delights.** Pasted drafts persist across refresh (`qs.draft.*`);
  word-count + read-time meters; outputs already render in serif.
- **`Start Quiet Shelf.bat`** — one-click launcher for non-technical sharing.
- **Launch hardening.** 23-case break-it battery (5000-word scripts, 30MB
  uploads, junk files, malformed JSON, prompt-injection, unicode, access gate).
  One real bug fixed: corrupt/renamed `.docx` now returns a clean 415, not a 500.

Tests: **126 pass.** Providers: **Groq** is the certified demo backend
(`LLM_PROVIDER=groq`); Gemini is a light-use fallback (free tier = 20 req/day/
model); Ollama (`qwen2.5:latest`) rehearsed locally at ~126 tok/s on the Legion
GPU — note the 7B finds fewer characters than Groq's 70B (honest small-model
tradeoff, not a bug).

## Known edges (not blocking, not yet fixed)

- **Imagine overwrites the last saved map.** After a found map, running Imagine
  replaces `qs.storymap.last` with the imagined one (last-map-wins). Grounding
  can't lie — imagined defaults OFF downstream — but the user loses found-map
  default-on grounding until they re-map. Minor polish for later.

## Next, when Quiet Shelf resumes

1. **Push to a private remote** (only open launch task).
2. **Corkboard visual for Story Map.** Original scope said "React Flow
   corkboard"; shipped a card board. Plan: an **SVG string overlay** drawing
   relationship curves between the existing cards (the data is already there:
   `character.relationships[].with`) — augment the cards, don't rebuild them.
3. **Friend access:** set `ACCESS_CODE` in `.env`, hand the friend the code.
4. Optional: hosting via a tunnel (Cloudflare Tunnel is the recommendation) with
   the Jetson as backend.

## How to run

- **Simplest:** double-click `Start Quiet Shelf.bat` (Windows) → localhost:8090.
- **Docker:** `docker compose up --build` → localhost:8000.
- **Dev:** `.venv\Scripts\python -m uvicorn app.main:app --port 8090`.
- Needs a free key in `.env` (`LLM_PROVIDER` = gemini | groq | ollama). Format
  works with no key at all.
