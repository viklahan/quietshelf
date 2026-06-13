# Quiet Fight Club

**Turn your script into a shot list.** Quiet Fight Club is a free, open-source
visual mapping tool for video essayists. Paste your script and it breaks the
whole thing into visual segments — with timing, three ready-to-use stock-footage
search terms per segment (tuned for libraries like Pexels), a mood tag, and a
suggested title. You stop staring at a wall of text wondering "what do I put on
screen here?" and start dragging clips into your timeline. No accounts, no
database, nothing stored — your script goes in, a shot list comes out.

## Run it free ($0, no credit card anywhere)

```bash
git clone https://github.com/your-username/quiet-fight-club.git
cd quiet-fight-club
cp .env.example .env
# Get a free Gemini key at https://aistudio.google.com (2 minutes, no card)
# and paste it into .env as GEMINI_API_KEY=...
docker compose up
```

Open <http://localhost:8000> — done. Total cost: **$0**.

## Pick your provider

There is no paid AI provider in this codebase. Choose with `LLM_PROVIDER`:

| Provider | `LLM_PROVIDER` | Why pick it | What you need |
|---|---|---|---|
| **Gemini** (default) | `gemini` | Easiest. Generous free tier. | Free key from [aistudio.google.com](https://aistudio.google.com) — no card |
| **Groq** | `groq` | Fastest. Runs open models (Llama 3.x). | Free key from [console.groq.com](https://console.groq.com) — no card |
| **Ollama** | `ollama` | Fully local, fully open source, zero cloud. | Install [ollama.com](https://ollama.com), then `ollama pull llama3.1:8b` — no key at all |

> **Ollama note:** an 8B model is the floor — smaller models produce unreliable
> JSON for this task. If the app runs in Docker and Ollama runs on your host
> machine, set `OLLAMA_HOST=http://host.docker.internal:11434`.

> **Honest note on free-tier limits:** Gemini and Groq free tiers have daily
> request caps — far more than one creator needs, but if you hit a 429
> ("the free AI tier needs a breather"), wait a minute and try again.

## Run on NVIDIA Jetson (fully local, GPU-accelerated)

Jetson devices (Orin, AGX, NX, Nano) can run the whole stack locally with no
internet dependency. Ollama runs on the Jetson GPU; the qfc app talks to it
over the Docker internal network.

**Prerequisites:**
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed on the Jetson host
- Docker and Docker Compose installed
- ~6 GB free storage for the model weights

```bash
git clone https://github.com/your-username/quiet-fight-club.git
cd quiet-fight-club
cp .env.jetson.example .env.jetson   # already configured for Ollama
# Start Ollama first and pull the model (one-time, ~5 GB download):
docker compose -f docker-compose.jetson.yml up -d ollama
bash jetson-setup.sh
# Then bring up the full stack:
docker compose -f docker-compose.jetson.yml up -d
```

Open <http://localhost:8000>. Everything runs on-device — script text never
leaves the Jetson.

> **Model choice:** `llama3.1:8b` (default) runs well on Jetson Orin NX 8 GB+.
> If you have an AGX Orin (16 GB+ VRAM), set `MODEL_NAME=llama3.1:70b` in
> `.env.jetson` for significantly better output quality.

## Deploy to Render (free tier, also $0)

1. Fork this repo on GitHub.
2. In [Render](https://render.com), click **New → Web Service** and connect your fork.
3. Render auto-detects the `Dockerfile`. Pick the **Free** instance type.
4. Under **Environment**, add:
   - `GEMINI_API_KEY` — your free key (mark it secret)
   - `ACCESS_CODE` — any passphrase, if you want your instance semi-private
5. Click **Create Web Service**. Render builds the container and gives you a URL.
   The health check path is `/api/health`.

Free-tier instances sleep after inactivity; the first request after a nap takes
~30s to wake up. That's normal.

## API

### `POST /api/map`

```json
{ "script": "full script text, 100-3000 words" }
```

Returns a validated shot list:

```json
{
  "video_title_suggestion": "string",
  "estimated_runtime_seconds": 580,
  "segments": [
    {
      "id": 1,
      "script_text": "string",
      "start_time": "0:00",
      "end_time": "0:18",
      "search_terms": ["term one", "term two", "term three"],
      "clip_duration_seconds": 9,
      "mood": "hopeful"
    }
  ]
}
```

Errors: `422` (script empty / too short / too long), `401` (missing or wrong
`X-Access-Code` when `ACCESS_CODE` is set), `429` (`{"error": "rate_limited"}` —
per-IP limit or the provider's free tier needs a breather), `502`
(`{"error": "mapping_failed"}` — the model returned an unreadable result twice,
or `{"error": "upstream_error"}` — the provider is down), `504` (the mapping
call exceeded 120 seconds).

### `GET /api/health`

Returns `{"status": "ok", "provider": "gemini"}`. Used by hosting platforms
for health checks.

## Configuration

All via environment variables (see `.env.example`):

| Variable | Default | What it does |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | `gemini`, `groq`, or `ollama`. |
| `GEMINI_API_KEY` | — | Required for gemini. Free at [aistudio.google.com](https://aistudio.google.com). |
| `GROQ_API_KEY` | — | Required for groq. Free at [console.groq.com](https://console.groq.com). |
| `OLLAMA_HOST` | `http://localhost:11434` | Where Ollama listens. No key needed. |
| `MODEL_NAME` | per provider | Override the model (defaults: `gemini-2.5-flash` / `llama-3.3-70b-versatile` / `llama3.1:8b`). |
| `ACCESS_CODE` | unset (open) | If set, `/api/map` requires a matching `X-Access-Code` header. |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins. |
| `RATE_LIMIT` | `10` | Requests per hour per IP on `/api/map`. Protects your free-tier quota. |
| `PORT` | `8000` | Listen port (set automatically by Render/Railway). |

If the selected provider's key is missing, the server refuses to start and
tells you exactly what to set and where to get it free.

## CLI mode

Map a script from the terminal without the frontend:

```bash
python -m qfc map script.txt --out shotlist.json
```

Writes `shotlist.json` plus a human-readable `shotlist.md` table next to it.
Uses the same `.env` / provider config as the server.

## Development

```bash
python -m venv .venv && .venv/Scripts/activate   # Windows; use bin/activate on macOS/Linux
pip install -r requirements-dev.txt
uvicorn app.main:app --reload                     # run locally
pytest                                            # run tests (no API key needed - all providers are mocked)
```

The frontend is served from `static/` — drop a build there and it's served at `/`.

Want another provider? The provider layer is pluggable: subclass `Provider` in
`app/providers.py`, implement `validate_config()` and `generate_mapping()`, and
register it in `_PROVIDERS`. Free-tier or open-model providers only, please.

## What this deliberately leaves out

No database. No user accounts. No queue. No websockets. No payments. No paid
AI providers. One endpoint, kept boring and bulletproof.

## License

[MIT](LICENSE)
