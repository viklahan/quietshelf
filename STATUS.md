# Quiet Shelf — STATUS

_Continuity doc. Last updated 2026-08-20 (late). Read this first on any return._

## Where it stands: **LIVE IN PRODUCTION**

**https://quietshelf.studio** — real domain, real HTTPS, real users.
**Repo:** https://github.com/viklahan/quietshelf (public, MIT)

Five services work, are hardened, and are running in production. First real
user (a writer friend) has been testing since 07-12 and reports he'll "use it
all the time." Work is paused at a clean stopping point.

**Live risk as of 08-20: provider health, not code — confirmed twice now.**
Free-tier keys are the single point of failure. On 08-19 the Groq key went
invalid (401) and Cerebras stayed unpaid (402), which left only Gemini's
20-req/day tier; one Promote run exhausted it and the whole site returned 502
on every AI path while nginx, uvicorn, TLS and the deploy were all perfectly
healthy. Groq is carrying the app again. A paid leg — any paid leg — is the
difference between "the shelf stands" and another evening like that one.

## Production environment

Small Linux VPS, Ubuntu, nginx terminating HTTPS (Let's Encrypt, auto-renewing)
in front of uvicorn on localhost, managed by a systemd unit with
`Restart=always`. LLM provider: Groq. **Model note:** `llama-3.3-70b-versatile`
was retired by Groq on 2026-06-17 and no longer exists; the ladder now lands on
`openai/gpt-oss-120b`. Two lower rungs are also dead as of 08-20 —
`openai/gpt-oss-20b` and `qwen/qwen3.6-27b` both return 400
`json_validate_failed` on the Promote schema, and `moonshotai/kimi-k2-instruct`
is gone from the account entirely.

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

## Shipped 2026-08-20 — why it worked for me and broke for them

**The pattern that mattered:** the link was shared twice after testing, and both
times it failed for the people who tried it. Not intermittently — reliably, for
them, never for the author. That asymmetry was the whole diagnosis.

**Root cause: the author writes scripts with line breaks; strangers paste
paragraphs.** `_beats()` splits on newlines only, so an essay pasted out of a
Google Doc arrives as ONE beat — and a lone beat gives the group loop nothing to
split on. A 5,000-word story went to the model in a single call. Same app, same
keys, same server, completely different code path. The author was never testing
what the users were doing.

Four faults chained off that one input shape:

1. **Prose was never chunked.** Oversized beats now split on sentences —
   `_split_sentences()` was still sitting in the file marked "legacy," from
   before `d8f7021` made chunking line-break-driven. Writers who DID break lines
   never reach that branch and keep their pacing exactly as written.

2. **One bad paste benched Groq for 600s, for every user.** The oversized call
   returned 400 `json_validate_failed`; the ladder treats that as a dead model,
   walked three more rungs, and concluded "No working Groq model found" — a
   phrase `_is_permanent_failure()` matches, so the waterfall cooled the whole
   provider down. `json_validate_failed` is a fact about THAT REQUEST, not the
   model: the same model serves a smaller chunk fine. Now tracked separately and
   worded as the retryable bad request it is.

3. **Valid JSON was being discarded.** `openai/gpt-oss-120b` is a REASONING
   model — it returns a complete object and then keeps talking about its
   choices. `_isolate_object` handed the whole string to `json.loads`, which
   said "Extra data" and binned a good mapping, which then triggered fault 2.
   Now uses `json.JSONDecoder().raw_decode()`: parse the first complete object,
   ignore the essay that follows.

4. **Chunk size was the reliability lever nobody was holding.** Measured against
   `gpt-oss-120b`, same essay, same prompt, size the only variable:

   | chunk target | valid JSON |
   |---|---|
   | 150 words | 8/8 (100%) |
   | 250 words | 4/6 (67%) |
   | 400 words | 2/4 (50%) |

   A 400-word chunk asks for ~12 segments x 6 search terms = 70+ constrained
   fields in one response; the longer it generates, the likelier Groq's
   validator rejects the lot. `223fcb0` raised this 200 -> 400 to "halve API
   calls" and quietly made every mapping call a coin flip. Back to 150, tunable
   with `PROMOTE_CHUNK_WORDS`. A failed chunk costs a retry, a keyword fallback,
   or the whole run — far more expensive than an extra call.

**Coverage is now enforced, not requested.** `RULES: 1. Cover EVERY line` was an
instruction the model was free to ignore, and it did — a 549-word essay came
back with 97 words missing from the middle and nothing on screen admitting it.
`_repair_coverage()` reinstates any skipped run in its original position as a
keyword-mapped segment flagged `needs_remap`, so the UI shows it and the remap
button fixes it. The writer's word count is the contract.

**Verified on the failing case** — the essay pasted as ONE paragraph:

| | before | after |
|---|---|---|
| chunks | 1 | 4 |
| coverage | 82% | **100%** |
| duplicate passages | yes | **0 exact, 0 near** |
| needs_remap | — | 0/18 |
| moods | 1 | 7 distinct |

198 tests pass, 11 new. Also dropped `moonshotai/kimi-k2-instruct` (404 on every
call; its 404 kept becoming the "Last:" error in the leg's verdict, so the log
blamed a model nobody uses for a failure the primary caused).

**Still true, and not a code problem:** that run took 103s for 549 words against
a 180s SSE budget. Free-tier Groq caps at 8,000 tokens/MINUTE — roughly two
chunks a minute for all users combined — so a long piece cannot finish in time
no matter how good the code is. Dropping `openrouter` (flat 45s timeout when
reached) and `cerebras` (402 on every call) from `WATERFALL_ORDER` reclaims real
wall-clock. Beyond that it is one paid leg or accepted limits; there is no third
option and no clever code that changes the arithmetic.

**Test what strangers do, not what you do.** Every fault above was invisible to
the author's own usage. The e2e suite now pastes prose as one paragraph.

## Shipped 2026-08-20 — the dead-key outage

**Symptom:** "the prod server is dead." It was not. `GET /api/health` returned
200 with all five services registered, the box pinged, SSH answered, TLS was
valid, and prod's route table was byte-identical to local HEAD — so code and
deploy were exonerated in the first two minutes. What was dead was every leg of
the provider waterfall.

**Root cause 1 — credentials.** Groq's key had gone invalid (401
`invalid_api_key`) and Cerebras was 402 unpaid, leaving only Gemini's 20
requests/day. One Promote run (~15 calls) finished it off. After that every AI
path returned 502.

**The diagnostic that mattered:** `POST /api/blurb` failed in **0.59 seconds**.
The 08-07 outage produced the identical user-facing message after 8+ minutes.
Slow-fail means a hang; fast-fail means every leg rejected at the door
(401/402/429, or an already-`_dead` cooldown skipping for free). Elapsed time
named the fault class before a single log line was read.

**Root cause 2 — `load_dotenv(override=False)`.** `app/config.py:8` loads the
env once at import, and python-dotenv does **not** overwrite variables already
present in the process environment. Two consequences, both of which cost real
time that night: a `.env` edit does nothing until `systemctl restart`, and any
systemd `Environment=`/`EnvironmentFile=` entry silently outranks the file
forever.

**Shipped fix — the app stops lying about retryability.** The waterfall already
set `exc.permanent` when every leg died a non-healing death (401 / 402 /
exhausted daily quota) and the Promote retry paths already honoured it
(`mapper.py:323,331`, `promote/router.py:177`). Only the HTTP layer ignored it,
so the one place a human actually reads went on offering patience as the cure
for a dead key. `llm_error_to_response` now checks `.permanent` first — ahead of
the type dispatch, because a daily-quota exhaustion arrives as
`ProviderRateLimited` and its 429 "the free AI tier needs a breather" was
equally untrue. Permanent failures return **503 `upstream_down`** and say the
outage is service-wide and won't clear on retry; transient failures keep the 502
and the original wording. The message names no provider; the diagnosis goes to
the log as `provider_permanently_down`. 187 tests pass, 2 new.

**Waterfall order matters more than it looks.** Local was
`openrouter,gemini,groq,cerebras`; OpenRouter trickle-reads, so every chunk paid
the full 45s `PROVIDER_DEADLINE_SECONDS` before reaching a working leg —
**75.8s per chunk**. Putting Groq first: **4.7s. 16× faster, one variable.**
Order the waterfall by measured latency and remaining quota, not by history.

**Verified on prod after the fix** (on quality, never on arrival):
`/api/promote` 200 in 20.9s, 7 segments, `needs_remap 0/7`, 7 distinct moods;
`/api/promote/stream` 43.8s, 5 segments, `needs_remap 0/5`, 5 distinct moods,
136s of SSE headroom. Blurb returns three genuinely distinct variants.

**Two traps worth remembering.** `.env.bak` is **not** gitignored (`.gitignore`
matches `.env` exactly) — `sed -i.bak` on this repo would drop live keys into a
public working tree; back up outside the repo. And a local Quiet Shelf that
appears "broken everywhere" may simply not be running: port 8000 is **Pelco
Validate**, not a stale squatter, and killing it would take down the wrong
project.

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
