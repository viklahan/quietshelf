# Quiet Shelf — STATUS

_Continuity doc. Last updated 2026-08-07. Read this first on any return._

## Where it stands: **LIVE IN PRODUCTION**

**https://quietshelf.studio** — real domain, real HTTPS, real users.
**Repo:** https://github.com/viklahan/quietshelf (public, MIT)

Five services work, are hardened, and are running in production. First real
user (a writer friend) has been testing since 07-12 and reports he'll "use it
all the time." Work is paused at a clean stopping point.

**Live risk as of 08-07: provider health, not code.** All four waterfall legs
were degraded simultaneously — OpenRouter trickling, Gemini 429 (free tier
20 req/day exhausted), Groq 400 `json_validate_failed`, Cerebras 402 payment
required. Groq is carrying the app. Worth choosing a dependable leg before the
next demo rather than discovering this live again.

## Production environment

Small Linux VPS, Ubuntu, nginx terminating HTTPS (Let's Encrypt, auto-renewing)
in front of uvicorn on localhost, managed by a systemd unit with
`Restart=always`. LLM provider: Groq, `llama-3.3-70b-versatile`.

**Host specifics — IP, paths, unit name, firewall rules — live in
`DEPLOY.local.md`, which is gitignored.** This repo is public; infrastructure
detail does not belong in it.

### Deploying an update
```bash
# locally: commit + push
git add -A && git commit -m "..." && git push

# on the server: pull and restart (exact commands in DEPLOY.local.md)
```

**Two-terminal rule:** the local shell is where `git push` lives; the server
shell is where systemctl/nginx/certbot live. The server has no push credentials
by design and doesn't need any.

## The five tabs

| Tab | What it does | State |
|---|---|---|
| **Format** | DOCX/RTF/TXT → themed EPUB. **No AI.** Always works even when the AI quota is dry. | Live |
| **Blurb** | Manuscript → back-cover copy, taglines, keywords | Live |
| **Scout** | Seed phrases → live search-autocomplete material (5 engines), then bring-your-own-prompt synthesis. Subreddit sources are BUILT but hidden behind `QS_SCOUT_REDDIT_ENABLED=false` in `scout.jsx` pending Reddit API approval. | Live |
| **Promote** | Writing → stock-footage shot list, with orientation filter | Live |
| **Story Map** | Manuscript → **corkboard** of characters/relationships (a mirror; opt-in Imagine invents, always stamped) | Live |

Promote also opens two sub-studios once a shot list exists: **Thumbnail Studio**
(1280×720 YouTube thumbnails) and **Narrate** (voice-over drafting).

## Shipped 2026-08-07 (late) — the Promote outage

**Symptom:** a DOCX that mapped in 15–30s locally starved on the live site and
failed with "Timed out waiting for chunks" after ~3 minutes.

**Root cause: an HTTP client timeout is not a deadline.** OpenRouter (first in
`WATERFALL_ORDER`, `openai/gpt-oss-20b:free`) returned 200 *headers* in ~5s then
dribbled the response body for 8+ minutes. httpx applies `read` PER SOCKET READ,
so any byte arriving before the timer expires resets it — `LLM_TIMEOUT_SECONDS`
(120s) never fired, `ProviderTimeout` was never raised, the waterfall never fell
through, and the promote stream gave up at `SSE_WAIT_TIMEOUT=180`.

**Fix (545832f):** `PROVIDER_DEADLINE_SECONDS = 45` gives each leg a true
wall-clock budget (daemon thread pool); expiry raises `ProviderTimeout`, turning
a silent hang into the honest failure the waterfall already handles. Plus
`TIMEOUT_STREAK_LIMIT = 2` → 300s cooldown so later chunks skip a bad leg at
zero cost; any success resets the streak. 182 tests pass (3 new regressions,
including a provider that never raises and never returns).

Same `VIDEO15.docx`, one variable changed:

| Ladder | Result |
|---|---|
| `openrouter,gemini,groq,cerebras` (before) | 180.2s, **0/3 chunks, failed** |
| `gemini,groq,cerebras` | 41.7s, 3/3 ✓ |
| openrouter first **+ fix** | 186.4s, 3/3 ✓ |

**Debugging method worth reusing:** md5 the served assets against local first —
all 18 static files were byte-identical, which exonerated the code and the
deploy immediately and pointed at environment. Then A/B one variable on one
machine. Then `faulthandler.dump_traceback()` from a watchdog thread to see
*where* it blocks; that stack (`httpcore._receive_response_body`) is what
disproved the initial "it's timing out at 120s" theory. **Note: httpx logs
`"HTTP Request ... 200 OK"` when HEADERS arrive, not the body — it is not proof
the call succeeded.**

**Deploy note:** the fix makes degradation graceful; it does not make a sick
provider fast. Until provider health recovers, prod wants
`WATERFALL_ORDER=gemini,groq,cerebras` in its `.env`.

## Shipped 2026-08-07

- **Reddit compliance.** Reddit's Responsible Builder Policy (June 2026) requires
  explicit approval for API access and prohibits masking identity. All UA-spoofing
  fallbacks were REMOVED (permanent test enforces the honest QuietShelf UA);
  app-only OAuth is built and dormant (`REDDIT_CLIENT_ID`/`SECRET` in `.env` +
  flag flip activates it once an access ticket is approved). Anonymous access
  403s from all tested networks — that's the policy, not a bug.
- **Scout UX**: clear-prompt button (two-click arm/confirm, 3s stand-down);
  FastAPI array-shaped 422 details now render as sentences, never
  `[object Object]`.
- **Thumbnail Studio**: corner-handle text resize (0.45–1.7×, preview-only —
  export repaints without the handle); `exact` mode through the cover-suggestions
  stack (frontend queries reach photo APIs unmangled; router + service n-clamps
  raised 5→12) — fixes recycled faces. Regression: `tests/test_cover_exact.py`
  includes a full-HTTP-path test because the router clamp hid from unit tests.
- **E2E unified**: `tests/qs_e2e_test.py` is the ONLY copy (root duplicate
  removed). AI-consuming tests (blurb, promote stream) are opt-in via `--ai`
  and minimal when on (1 blurb call, 1.2K-word stream) — the default run
  provably makes zero AI calls and never burns server quota. Includes Scout
  section (harvest + 422 check). `is_zipfile` misuse fixed via `BytesIO`.

- **Scout tab** — new independent service (`app/services/scout/`): `/api/scout/harvest`
  (search autocomplete across 5 engines + subreddit discussion) and
  `/api/scout/synthesize` (one waterfall call, bring-your-own-prompt, word-capped
  at 6000 material / 2500 prompt so one request can't eat the day's quota).
  Verified live: harvest returns real autocomplete material; empty request 422s.
- **Thumbnail Studio** and **Narrate**, mounted as sub-studios inside Promote.
- **Landing page gains a Scout door** — full-width, spanning both columns
  between the two rows (`.qs-door--wide`). Applied from the design drop-in.
- **`/api/health` now reports `scout`** — the services list was hardcoded and had
  gone stale, under-reporting what the app actually mounts.
- **Test collection repaired.** `tests/qs_e2e_test.py` matched pytest's default
  `*_test.py` glob, so pytest imported it during collection — where its
  module-level `sys.exit()` raised `INTERNALERROR` and **aborted the entire
  suite** (and fired live E2E traffic at production on every `pytest` run).
  `pyproject.toml` now pins `python_files = ["test_*.py"]`. The script still runs
  standalone: `python tests/qs_e2e_test.py`. **178 tests pass in ~18s** (they had
  been running zero).
- **Repo hygiene / public-repo scrub.** `_live.log`, `tests/test-run.log`, and
  `tests/test-report.log` were tracked and embedded local `C:\Users\...` paths —
  untracked (kept on disk) and gitignored, along with `/data/` scout snapshots.
  Production infrastructure detail (IP, host spec, paths, firewall, shell
  prompts) moved out of this public file into gitignored `DEPLOY.local.md`.

## Shipped in the launch session (2026-07-11 → 07-12)

- **Deployed to Hetzner** end to end: server, DNS, nginx, HTTPS, systemd.
- **Published to public GitHub.**
- **Story Map v2 — the corkboard.** Draggable pin-cards, labeled yarn threads
  (relationship type rendered *on* the line, colored by kind: oxblood =
  rivalry/betrayal, gold = romance, ember = family), deterministic
  importance-weighted starting layout, fit-to-width scaling, full-bleed
  breakout from the prose column.
- **Character editing.** Click a card → edit name, role, importance,
  personality, arc, all six texture fields → Save. Writes into the map object,
  so it updates the board, persists to localStorage, rides inside the
  downloaded `.json`, **and flows into Blurb/Promote grounding for free.**
  Layout positions persist the same way once dragged.
- **About page** — the four tabs, the "your story stays yours / anything added
  is stamped Imagined" promise, honest free-tier rate-limit note, GitHub links,
  clickable tab doors.
- **Private feedback box** — `POST /api/feedback` appends to `feedback.jsonl`
  on the server (gitignored). No email exposed.
- **Promote fixes** — orientation filter (Any/Horizontal/Vertical/Square →
  real Pexels `?orientation=` param, verified against the live site), result
  now survives refresh, live-busy lines built from the user's own pasted text.
- **Tooltips** across all four tabs (shared `Tooltip` in `ui.jsx`).
- **Logo** — V's own quill-and-inkpot art, background keyed to transparency,
  linework thickened; header, About hero, favicon, README.
- **requirements.txt regenerated** from the clean server install — two deps
  (`openai`, `python-multipart`) had been missing for months and only surfaced
  on the first truly clean install.

## Frontend architecture — READ BEFORE EDITING

- **No build system, no package.json.** `static/*.jsx` is loaded by explicit
  `<script>` tags in `static/index.html`, compiled by Babel in the browser,
  wired together via plain `window` globals.
- **A new file does nothing until you add its `<script>` tag to index.html.**
- **`frontend/components/*.jsx` is REFERENCE ONLY** — there is no rebuild step,
  so editing those files has zero effect on the running app.
- **`static/_ds_bundle.js` is pre-built. Never edit it.**
- `.qs-note` is a flex row expecting exactly two children (icon + one span).
  More loose children fragment the layout — wrap text in a single `<span>`.
- Design tokens in `static/tokens/colors.css`; app background `#15110d`.

## Known gaps (real, not blocking)

- **Access gate is not wired.** `app/deps.py` checks an `X-Access-Code` header,
  but `static/api.js` never sends one, and the server `.env` has no
  `ACCESS_CODE` line — so the check is bypassed entirely. **The site is open**,
  protected only by the hourly rate limiter and obscurity. Accepted for now.
  Building the frontend prompt + storage + header is the task before going wide.
- **No analytics.** Designed but unbuilt: `POST /api/event` appending
  `{event, tab, duration_seconds, ts}` to `events.jsonl`, frontend timing on
  tab switch + `navigator.sendBeacon` on close, one honest disclosure line on
  About. Meanwhile nginx access logs already answer "how many visitors, which
  endpoints" (one-liner in `DEPLOY.local.md`).
- **No admin view for feedback.** Read `feedback.jsonl` on the server directly.
  Nothing notifies you. Planned: a
  `GET /api/feedback` route gated by an `ADMIN_CODE` in `.env` (404s when
  unset, so self-hosters never expose a door they didn't configure).
- **Format:** an uploaded file does not survive a page refresh.
- **Blurb:** the generated result does not survive refresh (Promote and Story
  Map now do).
- **EPUB cover in external readers** — unresolved. The in-app "It's a book now"
  mockup now shows the real uploaded cover or real theme palette, but an
  external reader showed no cover. Suspected Pandoc EPUB2-vs-EPUB3 cover
  convention gap. **To diagnose: open an actual generated `.epub` (it's a zip)
  and read the OPF manifest.**
- **Imagine overwrites the last saved map** (last-map-wins). Grounding can't
  lie — imagined defaults OFF downstream — but found-map default-on grounding
  is lost until re-mapped.
- Service runs as **root**; a dedicated non-root user is better practice.
- **Stale branding:** LICENSE and SKILL.md still say "Quiet Fight Club."
- **epubcheck deliberately not used** — the PyPI package wraps a Java tool, and
  nothing else in this stack needs a JVM. Current lightweight zip/mimetype/
  container/OPF check is sufficient. Optional-if-Java-detected is the banked
  middle path if this ever targets KDP-grade validation.

## Banked ideas (designed, not committed to)

- **Draw-your-own threads + add-your-own sticky notes** — completes "the
  writer's hands" phase started by character editing.
- **The 3,000-word ceiling** is the biggest real limitation (a novel is 80k).
  Chunked extraction with character-merging across chunks is the hard,
  high-value problem.
- **Self-contained HTML export** — one file, board data baked in, opens in any
  browser forever. (Gemini's prototype did this as a Python/Tkinter export;
  HTML is the better version — same durability promise, no Python prerequisite.)
- **Image / storyboard cards** on the board.
- **Honest continuity checker** — the one genuinely good idea in the Gemini
  prototype, rebuilt on this project's grounding discipline: facts as verbatim
  quotes with positions in the real text, verified — never invented scores.
- **A second app on the same Hetzner box** — technically straightforward: own
  port, own systemd unit, nginx routes by domain, own certbot cert. This is
  also the point where Coolify becomes worth reconsidering (it was correctly
  skipped for a single app). Multiple projects on one box is the argument for
  keeping CPX22 rather than resizing down.

## How to run locally

- **Simplest:** double-click `Start Quiet Shelf.bat` (Windows) → localhost:8090.
- **Docker:** `docker compose up --build` → localhost:8000.
- **Dev:** `.venv\Scripts\python -m uvicorn app.main:app --port 8090`.
- Needs a free key in `.env` (`LLM_PROVIDER` = gemini | groq | ollama). Format
  works with no key at all.
