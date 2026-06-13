"""Provider layer tests - all three providers mocked, no network."""
from __future__ import annotations

import json

import httpx
import pytest

from app import providers
from app.providers import (
    GeminiProvider,
    GroqProvider,
    OllamaProvider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    get_provider,
    validate_startup,
)

SYSTEM = "test system prompt mentioning JSON"
SCRIPT = "a script"


# --- selection ---------------------------------------------------------------

def test_default_provider_is_gemini(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    assert isinstance(get_provider(), GeminiProvider)


@pytest.mark.parametrize(
    ("name", "cls"),
    [("gemini", GeminiProvider), ("groq", GroqProvider), ("ollama", OllamaProvider)],
)
def test_provider_selected_by_env(monkeypatch, name, cls):
    monkeypatch.setenv("LLM_PROVIDER", name)
    assert isinstance(get_provider(), cls)


def test_unknown_provider_fails_with_choices_listed(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "openai")
    with pytest.raises(ProviderConfigError, match="gemini, groq, ollama"):
        get_provider()


# --- startup validation -------------------------------------------------------

def test_missing_gemini_key_fails_startup_with_signup_url(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(ProviderConfigError, match="aistudio.google.com"):
        validate_startup()


def test_missing_groq_key_fails_startup_with_signup_url(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "groq")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with pytest.raises(ProviderConfigError, match="console.groq.com"):
        validate_startup()


def test_ollama_needs_no_key(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.delenv("OLLAMA_HOST", raising=False)
    assert isinstance(validate_startup(), OllamaProvider)


# --- gemini -------------------------------------------------------------------

class _FakeGeminiResponse:
    def __init__(self, text: str) -> None:
        self.text = text


class _FakeGeminiModels:
    def __init__(self, result):
        self._result = result

    def generate_content(self, **kwargs):
        if isinstance(self._result, Exception):
            raise self._result
        return self._result


class _FakeGeminiClient:
    instance_result = None

    def __init__(self, **kwargs) -> None:
        self.models = _FakeGeminiModels(type(self).instance_result)


def _patch_gemini(monkeypatch, result) -> None:
    _FakeGeminiClient.instance_result = result
    monkeypatch.setattr(providers.genai, "Client", _FakeGeminiClient)


def test_gemini_returns_raw_text(monkeypatch, valid_shot_list):
    _patch_gemini(monkeypatch, _FakeGeminiResponse(json.dumps(valid_shot_list)))
    raw = GeminiProvider().generate_mapping(SCRIPT, system=SYSTEM)
    assert json.loads(raw) == valid_shot_list


def test_gemini_429_becomes_rate_limited(monkeypatch):
    exc = providers.genai_errors.APIError(429, {"error": {"message": "quota", "status": "RESOURCE_EXHAUSTED"}})
    _patch_gemini(monkeypatch, exc)
    with pytest.raises(ProviderRateLimited):
        GeminiProvider().generate_mapping(SCRIPT, system=SYSTEM)


def test_gemini_500_becomes_provider_error(monkeypatch):
    exc = providers.genai_errors.APIError(500, {"error": {"message": "boom", "status": "INTERNAL"}})
    _patch_gemini(monkeypatch, exc)
    with pytest.raises(ProviderError):
        GeminiProvider().generate_mapping(SCRIPT, system=SYSTEM)


# --- groq ---------------------------------------------------------------------

class _FakeGroqChoice:
    def __init__(self, content: str) -> None:
        self.message = type("M", (), {"content": content})()


class _FakeGroqCompletions:
    def __init__(self, result):
        self._result = result

    def create(self, **kwargs):
        if isinstance(self._result, Exception):
            raise self._result
        return type("R", (), {"choices": [_FakeGroqChoice(self._result)]})()


class _FakeGroqClient:
    instance_result = None

    def __init__(self, **kwargs) -> None:
        completions = _FakeGroqCompletions(type(self).instance_result)
        self.chat = type("Chat", (), {"completions": completions})()


def _patch_groq(monkeypatch, result) -> None:
    _FakeGroqClient.instance_result = result
    monkeypatch.setattr(providers.groq_sdk, "Groq", _FakeGroqClient)


def _groq_http_response(status: int) -> httpx.Response:
    request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    return httpx.Response(status, request=request)


def test_groq_returns_raw_text(monkeypatch, valid_shot_list):
    _patch_groq(monkeypatch, json.dumps(valid_shot_list))
    monkeypatch.setenv("GROQ_API_KEY", "test")
    raw = GroqProvider().generate_mapping(SCRIPT, system=SYSTEM)
    assert json.loads(raw) == valid_shot_list


def test_groq_429_becomes_rate_limited(monkeypatch):
    exc = providers.groq_sdk.RateLimitError(
        "rate limited", response=_groq_http_response(429), body=None
    )
    _patch_groq(monkeypatch, exc)
    monkeypatch.setenv("GROQ_API_KEY", "test")
    with pytest.raises(ProviderRateLimited):
        GroqProvider().generate_mapping(SCRIPT, system=SYSTEM)


# --- ollama --------------------------------------------------------------------

def _patch_ollama_post(monkeypatch, handler) -> None:
    monkeypatch.setattr(providers.httpx, "post", handler)


def test_ollama_returns_response_field(monkeypatch, valid_shot_list):
    def fake_post(url, json=None, timeout=None):
        assert url.endswith("/api/generate")
        assert json["format"] == "json"
        assert json["stream"] is False
        request = httpx.Request("POST", url)
        import json as json_mod

        return httpx.Response(
            200,
            request=request,
            text=json_mod.dumps({"response": json_mod.dumps(valid_shot_list)}),
        )

    _patch_ollama_post(monkeypatch, fake_post)
    raw = OllamaProvider().generate_mapping(SCRIPT, system=SYSTEM)
    assert json.loads(raw) == valid_shot_list


def test_ollama_missing_model_gives_pull_hint(monkeypatch):
    def fake_post(url, json=None, timeout=None):
        return httpx.Response(404, request=httpx.Request("POST", url))

    _patch_ollama_post(monkeypatch, fake_post)
    with pytest.raises(ProviderError, match="ollama pull"):
        OllamaProvider().generate_mapping(SCRIPT, system=SYSTEM)


def test_ollama_unreachable_gives_install_hint(monkeypatch):
    def fake_post(url, json=None, timeout=None):
        raise httpx.ConnectError("connection refused")

    _patch_ollama_post(monkeypatch, fake_post)
    with pytest.raises(ProviderError, match="ollama.com"):
        OllamaProvider().generate_mapping(SCRIPT, system=SYSTEM)
