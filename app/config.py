"""Environment-driven configuration, read lazily so tests/CLI can adjust it."""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

DEFAULT_PROVIDER = "gemini"
DEFAULT_MODELS = {
    "gemini": "gemini-2.5-flash",
    "groq": "llama-3.3-70b-versatile",
    "ollama": "qwen2.5:latest",
    "openrouter": "openai/gpt-oss-20b:free",
}
# OpenRouter free model slugs get retired without notice. If the configured
# model 404s ("unavailable for free"), the provider walks this list so the app
# self-heals instead of failing. All must support JSON (response_format).
DEFAULT_OPENROUTER_FALLBACKS = [
    "openai/gpt-oss-20b:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "google/gemma-4-31b-it:free",
]
DEFAULT_OLLAMA_HOST = "http://localhost:11434"
# Client-side pacing: max upstream requests per rolling minute, per provider.
# Gemini's free tier allows ~10 RPM; 8 leaves headroom for anything else the
# key is doing. 0 = unpaced. Ollama is local - never paced by default.
DEFAULT_PROVIDER_RPM = {"gemini": 8}
DEFAULT_RATE_LIMIT = 20  # requests per hour per IP
DEFAULT_MAX_UPLOAD_MB = 25
LLM_TIMEOUT_SECONDS = 120.0

# Promote word bounds
MIN_WORDS = 100
MAX_WORDS = 3000


def provider_name() -> str:
    return os.getenv("LLM_PROVIDER", DEFAULT_PROVIDER).strip().lower()


def model_name() -> str:
    override = os.getenv("MODEL_NAME", "").strip()
    return override or DEFAULT_MODELS.get(provider_name(), "")


def provider_rpm(provider: str) -> int:
    """Client-side requests-per-minute cap for a provider. Override with
    <PROVIDER>_RPM (e.g. GEMINI_RPM=5); 0 disables pacing."""
    raw = os.getenv(f"{provider.upper()}_RPM", "").strip()
    if raw:
        try:
            return max(0, int(raw))
        except ValueError:
            pass
    return DEFAULT_PROVIDER_RPM.get(provider, 0)


def openrouter_fallback_models() -> list[str]:
    """Models to try (in order) when the configured OpenRouter model is gone.
    Override with a comma-separated OPENROUTER_FALLBACK_MODELS."""
    raw = os.getenv("OPENROUTER_FALLBACK_MODELS", "").strip()
    if raw:
        return [m.strip() for m in raw.split(",") if m.strip()]
    return list(DEFAULT_OPENROUTER_FALLBACKS)


def gemini_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()

def openrouter_api_key() -> str:
    return os.getenv("OPENROUTER_API_KEY", "").strip()

def groq_api_key() -> str:
    return os.getenv("GROQ_API_KEY", "").strip()


def ollama_host() -> str:
    return os.getenv("OLLAMA_HOST", DEFAULT_OLLAMA_HOST).strip().rstrip("/")


def access_code() -> str | None:
    code = os.getenv("ACCESS_CODE", "").strip()
    return code or None


def allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "*")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def rate_limit_per_hour() -> int:
    raw = os.getenv("RATE_LIMIT", str(DEFAULT_RATE_LIMIT)).split("/")[0].strip()
    return int(raw or DEFAULT_RATE_LIMIT)


def max_upload_mb() -> int:
    return int(os.getenv("MAX_UPLOAD_MB", str(DEFAULT_MAX_UPLOAD_MB)))
