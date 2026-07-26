"""Cerebras free tier — wafer-scale inference, 1M tokens/day, no credit card.

OpenAI-compatible endpoint (base_url swap only). The free tier hard-caps
context at 8,192 tokens, so Cerebras is best for Blurb and short Promote
calls. Story Map's full extraction on a dense manuscript can exceed the cap —
in that case Cerebras raises ProviderError and the waterfall moves on.

Register at https://cloud.cerebras.ai — free, no card.
"""
from __future__ import annotations
import logging
from app import config
from app.providers.base import (
    Provider, ProviderConfigError, ProviderError, ProviderRateLimited, ProviderTimeout,
)
from app.providers.pacing import acquire_slot

logger = logging.getLogger("quietshelf.cerebras")
DEFAULT_CEREBRAS_MODELS = ["llama-3.3-70b", "llama3.1-70b", "qwen3-32b"]


class CerebrasProvider(Provider):
    name = "cerebras"

    def validate_config(self) -> None:
        if not config.cerebras_api_key():
            raise ProviderConfigError(
                "CEREBRAS_API_KEY not set. Free key at https://cloud.cerebras.ai"
            )

    def generate(self, system_prompt: str, user_content: str, json_mode: bool = True) -> str:
        key = config.cerebras_api_key()
        if not key:
            raise ProviderConfigError("CEREBRAS_API_KEY missing")
        try:
            import openai as sdk
        except ImportError as e:
            raise ProviderError("openai not installed") from e

        acquire_slot(self.name)
        client = sdk.OpenAI(
            api_key=key,
            base_url="https://api.cerebras.ai/v1",
            timeout=config.LLM_TIMEOUT_SECONDS,
            max_retries=0,
        )
        models = [config.cerebras_model_name()] if config.cerebras_model_name() else list(DEFAULT_CEREBRAS_MODELS)
        last = None
        for model in models:
            kw: dict = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
            }
            if json_mode:
                kw["response_format"] = {"type": "json_object"}
            try:
                return client.chat.completions.create(**kw).choices[0].message.content or ""
            except sdk.RateLimitError as e:
                raise ProviderRateLimited(str(e)) from e
            except sdk.APITimeoutError as e:
                raise ProviderTimeout(str(e)) from e
            except sdk.NotFoundError as e:
                logger.warning("cerebras model %s not found, trying next", model)
                last = e
                continue
            except sdk.BadRequestError as e:
                raise ProviderError(f"Cerebras context cap exceeded: {e}") from e
            except sdk.APIError as e:
                raise ProviderError(f"Cerebras error: {e}") from e
        raise ProviderError(f"No working Cerebras model. Tried: {models}. Last: {last}")
