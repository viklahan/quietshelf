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
}
DEFAULT_OLLAMA_HOST = "http://localhost:11434"
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


def gemini_api_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


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
