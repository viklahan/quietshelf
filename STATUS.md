# Quiet Shelf — STATUS

_Continuity doc. Last updated 2026-07-18. Read this first on any return._

## Where it stands: **LIVE IN PRODUCTION**

**https://quietshelf.studio** — real domain, real HTTPS, real users.
**Repo:** https://github.com/viklahan/quietshelf (public, MIT)

Four services work, are hardened, and are running in production. First real
user (a writer friend) has been testing since 07-12 and reports he'll "use it
all the time." Work is paused at a clean stopping point.

## Production environment

| | |
|---|---|
| Host | Hetzner CPX22 (2 vCPU / 4 GB / 80 GB), Ubuntu 26.04, Falkenstein |
| IP | 167.233.217.220 |
| Domain | quietshelf.studio (Porkbun; A records @ and www → the IP) |
| TLS | Let's Encrypt via certbot --nginx; **expires 2026-10-09**, auto-renews |
| App | systemd unit `quietshelf.service`, uvicorn on :8000, `Restart=always` |
| Proxy | nginx → 127.0.0.1:8000 (`/etc/nginx/sites-available/quietshelf`) |
| Code | `/root/quietshelf` (git clone, **pull-only** — no push creds by design) |
| Provider | Groq, `llama-3.3-70b-versatile` |
| Swap | 2 GB swapfile (box shipped with 0) |
| Firewall | ufw: OpenSSH + Nginx Full |

### Deploying an update
```bash
# on Windows: commit + push
git add -A && git commit -m "..." && git push

# on the server:
cd /root/quietshelf && git pull && systemctl restart quietshelf
systemctl status quietshelf --no-pager
```
Runbook: `/mnt/user-data/outputs/DEPLOY_Hetzner.md` (from the launch session).

**Two-terminal rule:** `vikra@Legion7 MINGW64` = Windows (git push lives here).
`root@ubuntu-4gb-fsn1-1` = server (systemctl/nginx/certbot live here). The
server cannot push to GitHub and doesn't need to.

## The four tabs

| Tab | What it does | State |
|---|---|---|
| **Format** | DOCX/RTF/TXT → themed EPUB. **No AI.** Always works even when the AI quota is dry. | Live |
| **Blurb** | Manuscript → back-cover copy, taglines, keywords | Live |
| **Promote** | Writing → stock-footage shot list, with orientation filter | Live |
| **Story Map** | Manuscript → **corkboard** of characters/relationships (a mirror; opt-in Imagine invents, always stamped) | Live |

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
  endpoints" (`awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -rn`).
- **No admin view for feedback.** Read it with
  `cat /root/quietshelf/feedback.jsonl`. Nothing notifies you. Planned: a
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
