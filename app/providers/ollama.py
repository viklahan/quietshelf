"""Local Ollama via its REST API. No key, no cloud, fully open source."""
from __future__ import annotations

import httpx

from app import config
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)


class OllamaProvider(Provider):
    name = "ollama"

    def validate_config(self) -> None:
        if not config.ollama_host():
            raise ProviderConfigError(
                "OLLAMA_HOST is empty. Set it to your Ollama server, e.g. "
                "http://localhost:11434. Install Ollama free at "
                "https://ollama.com, then run: ollama pull "
                f"{config.DEFAULT_MODELS['ollama']}"
            )

    def generate(
        self, system_prompt: str, user_content: str, json_mode: bool = True
    ) -> str:
        host = config.ollama_host()
        payload = {
            "model": config.model_name(),
            "system": system_prompt,
            "prompt": user_content,
            "stream": False,
        }
        if json_mode:
            payload["format"] = "json"
        try:
            response = httpx.post(
                f"{host}/api/generate",
                json=payload,
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
            raise ProviderRateLimited("Ollama returned HTTP 429")
        if response.status_code >= 400:
            raise ProviderError(f"Ollama returned HTTP {response.status_code}")
        return response.json().get("response", "")
