# <img src="static/assets/logo-mark.png" width="36" alt="" /> Quiet Shelf

Hand over the hard part. Quiet Shelf takes a writer's manuscript and quietly
returns finished, sellable, promotable things — your story, on the shelf. It's
free, open-source, and runs on free-tier or fully-local AI. No accounts, no
billing, no paid AI keys.

## Four services

- **Format** — turn a manuscript (DOCX/RTF/TXT) into a beautiful, themed EPUB. No AI at all.
- **Blurb** — turn a manuscript into back-cover copy, taglines, and store keywords.
- **Promote** — turn a written piece into a stock-footage shot list for a promo video.
- **Story Map** — turn a manuscript into a character/relationship map. A *mirror*:
  it reflects what's on the page and never invents. When there's nothing to
  reflect, the opt-in **Imagine** door lets you ask it to dream a cast up instead
  — everything imagined is clearly stamped as invented, never passed off as found.

Each service is fully independent — they share only the provider layer and file
ingestion, never each other.

### The map is the pipeline

Save a Story Map and you can **ground** Blurb and Promote with it: the confirmed
cast becomes shared truth, so names, roles, and relationships stay consistent
instead of being re-guessed on every run. Promote also reuses the same
stock-footage search per character across segments, so the same person keeps the
same look through the whole video. The honesty rule travels: a *found* map
grounds by default, an *imagined* one only when you opt in, and the "imagined"
stamp follows the data everywhere it goes.

## Quickest start (Windows)

Double-click **`Start Quiet Shelf.bat`**. First run sets up its own Python
environment and installs dependencies; after that it just opens the app in your
browser at http://localhost:8090. Built so a non-technical writer can run it
without a terminal. (You still need a free AI key in `.env` — see below.)

## Run it free (Gemini or Groq)

1. `git clone` this repo.
2. Get a free key (no card): Gemini at https://aistudio.google.com, or Groq at
   https://console.groq.com.
3. `cp .env.example .env`, set `LLM_PROVIDER` to `gemini` or `groq`, and paste
   the matching key.
4. `docker compose up --build`
5. Open http://localhost:8000

## Run it private / offline (Ollama)

Install Ollama (https://ollama.com), then:

```
ollama pull qwen2.5:latest
```

Set `LLM_PROVIDER=ollama` and `OLLAMA_HOST=http://localhost:11434` in `.env`.
Nothing leaves your machine. (Format never uses AI at all.)

## CLI

```
pip install -e .
quiet-shelf format manuscript.docx --title "My Stories" --author "Name" --theme cozy --out book.epub
quiet-shelf blurb manuscript.docx --tone warm
quiet-shelf promote script.txt --out shotlist.json
quiet-shelf storymap manuscript.docx --out map.json
quiet-shelf imagine notes.txt --mode seed --nudge "cozy mystery" --out imagined.json
quiet-shelf themes
quiet-shelf health
```

`storymap` reflects only what's in the text; `imagine` (modes: `seed`, `full`,
`prompts`) is the opt-in door that invents from any material — add `--reroll`
for a fresh take. Every CLI command runs in-process with the same provider
config as the server.

## A note on EPUBs

EPUB is reflowable: we preserve your structure, styling, images, and embed the
theme's font, but the layout is not pixel-perfect — readers re-flow text to fit
any screen. Some e-readers override embedded fonts; we embed them anyway. Plain
TXT has no structure, so those books lean entirely on the chosen theme.

## License

MIT.
