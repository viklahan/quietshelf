"""Google Gemini free tier via the google-genai SDK. Native JSON mode."""
from __future__ import annotations

import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types

from app import config
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)
from app.providers.pacing import acquire_slot


class GeminiProvider(Provider):
    name = "gemini"

    def validate_config(self) -> None:
        if not config.gemini_api_key():
            raise ProviderConfigError(
                "GEMINI_API_KEY is not set. Get a free key (no card needed) at "
                "https://aistudio.google.com, put it in your .env file, and "
                "restart. Or switch providers with LLM_PROVIDER=groq|ollama."
            )

    def generate(
        self, system_prompt: str, user_content: str, json_mode: bool = True
    ) -> str:
        acquire_slot(self.name)
        client = genai.Client(
            api_key=config.gemini_api_key(),
            http_options=genai_types.HttpOptions(
                timeout=int(config.LLM_TIMEOUT_SECONDS * 1000)  # milliseconds
            ),
        )
        try:
            response = client.models.generate_content(
                model=config.model_name(),
                contents=user_content,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json" if json_mode else None,
                    # This is structured extraction / short-form copy, not
                    # reasoning - Gemini 2.5 Flash's default "thinking" only adds
                    # latency here, so turn it off. (Flash/Flash-Lite support
                    # thinking_budget=0; 2.5-pro does not.)
                    thinking_config=genai_types.ThinkingConfig(thinking_budget=0),
                ),
            )
        except genai_errors.APIError as exc:
            if exc.code == 429:
                raise ProviderRateLimited(str(exc)) from exc
            raise ProviderError(f"Gemini API error (HTTP {exc.code})") from exc
        except httpx.TimeoutException as exc:
            raise ProviderTimeout(str(exc)) from exc
        return response.text or ""
