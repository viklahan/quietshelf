"""Pluggable LLM provider layer - free-tier and open-model providers only.

Every provider implements the same contract: generate_mapping(script, system)
returns the raw model text for one mapping call. Adding a provider is three
steps: subclass Provider, implement validate_config() and generate_mapping(),
and register the class in _PROVIDERS.

There is deliberately no paid provider here. Supported:
  - gemini  (default) - free API key from https://aistudio.google.com, no card
  - groq    - free API key from https://console.groq.com, open models, no card
  - ollama  - fully local open-source models from https://ollama.com, no key
"""
from __future__ import annotations

import logging

import groq as groq_sdk
import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types

from app import config

logger = logging.getLogger("qfc.providers")


class ProviderConfigError(Exception):
    """The provider is misconfigured (missing key, unknown name). Fatal at startup."""


class ProviderError(Exception):
    """The upstream model API failed."""


class ProviderRateLimited(ProviderError):
    """Free-tier rate limit hit (HTTP 429 upstream)."""


class ProviderTimeout(ProviderError):
    """The model call exceeded the timeout cap."""


class Provider:
    """Base contract. One mapping call in, raw model text out."""

    name: str = "base"

    def validate_config(self) -> None:
        """Raise ProviderConfigError if required keys/hosts are missing."""
        raise NotImplementedError

    def generate_mapping(self, script: str, system: str) -> str:
        """Run one mapping call and return the raw model text."""
        raise NotImplementedError


class GeminiProvider(Provider):
    """Google Gemini free tier via the google-genai SDK. Native JSON mode."""

    name = "gemini"

    def validate_config(self) -> None:
        if not config.gemini_api_key():
            raise ProviderConfigError(
                "GEMINI_API_KEY is not set. Get a free key (no card needed) at "
                "https://aistudio.google.com, put it in your .env file, and "
                "restart. Or switch providers with LLM_PROVIDER=groq|ollama."
            )

    def generate_mapping(self, script: str, system: str) -> str:
        client = genai.Client(
            api_key=config.gemini_api_key(),
            http_options=genai_types.HttpOptions(
                timeout=int(config.LLM_TIMEOUT_SECONDS * 1000)  # milliseconds
            ),
        )
        try:
            response = client.models.generate_content(
                model=config.model_name(),
                contents=script,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json",
                ),
            )
        except genai_errors.APIError as exc:
            if exc.code == 429:
                raise ProviderRateLimited(str(exc)) from exc
            raise ProviderError(f"Gemini API error (HTTP {exc.code})") from exc
        except httpx.TimeoutException as exc:
            raise ProviderTimeout(str(exc)) from exc
        return response.text or ""


class GroqProvider(Provider):
    """Groq free tier via the groq SDK - open models (Llama 3.x) at high speed."""

    name = "groq"

    def validate_config(self) -> None:
        if not config.groq_api_key():
            raise ProviderConfigError(
                "GROQ_API_KEY is not set. Get a free key (no card needed) at "
                "https://console.groq.com, put it in your .env file, and "
                "restart. Or switch providers with LLM_PROVIDER=gemini|ollama."
            )

    def generate_mapping(self, script: str, system: str) -> str:
        client = groq_sdk.Groq(
            api_key=config.groq_api_key(),
            timeout=config.LLM_TIMEOUT_SECONDS,
            max_retries=0,
        )
        try:
            response = client.chat.completions.create(
                model=config.model_name(),
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": script},
                ],
                # JSON mode requires the word "JSON" in the prompt; the system
                # prompt satisfies that.
                response_format={"type": "json_object"},
            )
        except groq_sdk.RateLimitError as exc:
            raise ProviderRateLimited(str(exc)) from exc
        except groq_sdk.APITimeoutError as exc:
            raise ProviderTimeout(str(exc)) from exc
        except groq_sdk.APIError as exc:
            raise ProviderError(f"Groq API error: {type(exc).__name__}") from exc
        return response.choices[0].message.content or ""


class OllamaProvider(Provider):
    """Local Ollama via its REST API. No key, no cloud, fully open source.

    An 8B model (e.g. llama3.1:8b) is the floor - smaller models produce
    unreliable JSON for this task.
    """

    name = "ollama"

    def validate_config(self) -> None:
        if not config.ollama_host():
            raise ProviderConfigError(
                "OLLAMA_HOST is empty. Set it to your Ollama server, e.g. "
                "http://localhost:11434. Install Ollama free at "
                "https://ollama.com, then run: ollama pull "
                f"{config.DEFAULT_MODELS['ollama']}"
            )

    def generate_mapping(self, script: str, system: str) -> str:
        host = config.ollama_host()
        try:
            response = httpx.post(
                f"{host}/api/generate",
                json={
                    "model": config.model_name(),
                    "system": system,
                    "prompt": script,
                    "format": "json",
                    "stream": False,
                },
                timeout=config.LLM_TIMEOUT_SECONDS,
            )
        except httpx.TimeoutException as exc:
            raise ProviderTimeout(str(exc)) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                f"Could not reach Ollama at {host} - is it running? "
                "Install it free at https://ollama.com"
            ) from exc
        if response.status_code == 404:
            raise ProviderError(
                f"Ollama doesn't have the model '{config.model_name()}'. "
                f"Run: ollama pull {config.model_name()}"
            )
        if response.status_code == 429:
            raise ProviderRateLimited(f"Ollama returned HTTP 429")
        if response.status_code >= 400:
            raise ProviderError(f"Ollama returned HTTP {response.status_code}")
        return response.json().get("response", "")


_PROVIDERS: dict[str, type[Provider]] = {
    GeminiProvider.name: GeminiProvider,
    GroqProvider.name: GroqProvider,
    OllamaProvider.name: OllamaProvider,
}


def get_provider() -> Provider:
    """Instantiate the provider selected by LLM_PROVIDER (default: gemini)."""
    name = config.provider_name()
    provider_cls = _PROVIDERS.get(name)
    if provider_cls is None:
        raise ProviderConfigError(
            f"Unknown LLM_PROVIDER '{name}'. "
            f"Choose one of: {', '.join(sorted(_PROVIDERS))}."
        )
    return provider_cls()


def validate_startup() -> Provider:
    """Resolve and validate the configured provider; raise a clear, actionable
    ProviderConfigError if anything required is missing."""
    provider = get_provider()
    provider.validate_config()
    return provider
