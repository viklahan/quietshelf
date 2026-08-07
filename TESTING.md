# Quiet Shelf — Testing Workflow

The rule that ends dead-on-arrival commits: **nothing commits until everything is green.**

## The one command

Double-click **`QS Test.bat`** (or run it from a terminal). It runs, in order:

1. **DOCTOR** (`tools/qs_doctor.py`) — is the environment even capable of running the app?
   Verifies the `.venv` interpreter, imports every dependency, imports `app.main`
   (catches the exact crash uvicorn would die with), checks `.env`, port 8090,
   and that every file `index.html` references exists on disk.
2. **LAYER A** (`tools/layer_a_static.py`) — static checks, instant.
   Every `.py` compiles, the internal import graph resolves
   (`from app.X import Y` where Y doesn't exist = the class of bug that took the
   server down twice), CSS braces balanced, index.html references resolve,
   JSX transforms (if node + babel installed).
3. **PYTEST** — the full unit/endpoint suite in `tests/` (48+ tests: providers,
   waterfall, json engine, promote validation/fallback/429 behavior, infra).
4. **LAYER B** (`tests/layer_b_contract.py`) — boots the REAL app in-process
   and hits every endpoint with real files. The AI layer is monkeypatched to
   canned valid data, so it's deterministic and burns zero quota. Covers:
   health, promote/extract (the browse path — txt/rtf/docx + rejects junk),
   the full SSE stream (meta→chunks→done, 100% word coverage, script order,
   title), format (real pandoc → validated EPUB), cover-suggestions, and a
   permanent regression suite (R1–R5) for every bug we've fixed.

Output lands in `tests/test-run.log` and `tests/test-report.log` — Claude reads
these directly off disk, so a failed run needs zero terminal copy-pasting.

## Running the app

- **`Dev Quiet Shelf.bat`** — for development. Kills anything stale on :8090,
  verifies deps, starts `.venv` uvicorn with `--reload`, logs to `_live.log`.
  **Caveat learned the hard way:** on Windows, `--reload` does NOT reliably
  detect Python files written through the Claude Filesystem connector. After
  any backend (.py) change, double-click the dev bat again — it kills and
  restarts in one click. Static files (jsx/css/html) are served fresh without
  a restart.
- **`Start Quiet Shelf.bat`** — for normal use. Kills stale servers, checks
  deps, starts without reload, opens the browser.

Never start the app with bare `uvicorn ...` from a shell — that binds to
whatever Python is on PATH (the system 3.13, not the `.venv`), which is how the
google-genai import crash and the 404-on-new-endpoints both happened.

## Live smoke (Layer C)

`tests/qs_e2e_test.py` hits the actually-running server over HTTP (edit BASE to
`http://127.0.0.1:8090` for local). Run it after `Dev Quiet Shelf.bat` is up
when you want end-to-end proof including real AI calls. It burns quota — use it
before a deploy, not on every edit.

Optional: `layer_b_contract.py --live` also exercises real AI + real image
fetches in-process.

## The discipline

1. Claude changes code → runs Layer A equivalents in its sandbox → hands over
   only when green there.
2. You run `QS Test.bat` → it writes the logs.
3. Claude reads the logs. **Green → commit. Red → fix, repeat.**
4. Every new bug gets a permanent test (add to B7 regressions or `tests/`)
   before the fix is considered done.

## Adding a regression test

Fixed a bug? Before calling it done, add a test that fails on the old behavior:
- Endpoint behavior → `tests/layer_b_contract.py` section B7
- Pure logic → a `tests/test_*.py` pytest file
