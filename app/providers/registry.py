"""Provider registry: select and validate the configured provider."""
from __future__ import annotations

from app import config
from app.providers.base import Provider, ProviderConfigError
from app.providers.gemini import GeminiProvider
from app.providers.groq import GroqProvider
from app.providers.ollama import OllamaProvider
from app.providers.openrouter import OpenRouterProvider

_PROVIDERS: dict[str, type[Provider]] = {
    GeminiProvider.name: GeminiProvider,
    GroqProvider.name: GroqProvider,
    OllamaProvider.name: OllamaProvider,
    OpenRouterProvider.name: OpenRouterProvider,
}
def get_provider() -> Provider:
    name = config.provider_name()
    provider_cls = _PROVIDERS.get(name)
    if provider_cls is None:
        valid = ", ".join(sorted(_PROVIDERS))
        raise ProviderConfigError(
            f"Unknown LLM_PROVIDER '{name}'. Choose one of: {valid}."
        )
    return provider_cls()

def validate_startup() -> Provider:
    """Resolve and validate the configured provider; raise a clear, actionable
    ProviderConfigError if anything required is missing."""
    provider = get_provider()
    provider.validate_config()
    return provider
