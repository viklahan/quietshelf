"""Pluggable LLM provider layer - free-tier and open-model providers only.

Every provider implements one method: generate(system_prompt, user_content,
json_mode) -> raw model text. Adding a provider is three steps: subclass
Provider, implement validate_config() and generate(), register it in registry.py.

No paid provider exists here. Supported:
  - gemini  (default) - free API key from https://aistudio.google.com, no card
  - groq    - free API key from https://console.groq.com, open models, no card
  - ollama  - fully local open-source models from https://ollama.com, no key
"""
from __future__ import annotations


class ProviderConfigError(Exception):
    """Provider misconfigured (missing key, unknown name). Fatal at startup."""


class ProviderError(Exception):
    """The upstream model API failed."""


class ProviderRateLimited(ProviderError):
    """Free-tier rate limit hit (HTTP 429 upstream)."""


class ProviderTimeout(ProviderError):
    """The model call exceeded the timeout cap."""


class Provider:
    """Base contract. One call in, raw model text out."""

    name: str = "base"

    def validate_config(self) -> None:
        """Raise ProviderConfigError if required keys/hosts are missing."""
        raise NotImplementedError

    def generate(
        self, system_prompt: str, user_content: str, json_mode: bool = True
    ) -> str:
        """Run one model call and return the raw text response."""
        raise NotImplementedError
