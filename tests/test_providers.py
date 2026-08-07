"""Provider layer tests - all three providers mocked, no network."""
from __future__ import annotations

import json

import httpx
import pytest

from app.providers import gemini as gemini_mod
from app.providers import groq as groq_mod
from app.providers import ollama as ollama_mod
from app.providers import (
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    get_provider,
    validate_startup,
)
from app.providers.gemini import GeminiProvider
from app.providers.groq import GroqProvider
from app.providers.ollama import OllamaProvider

SYSTEM = "test system prompt mentioning JSON"
USER = "a script"


def test_model_name_resolves_per_provider_under_waterfall(monkeypatch):
    """Under LLM_PROVIDER=waterfall each provider must resolve its OWN default
    model. The old global lookup returned "" (no 'waterfall' key), which the
    MODEL_NAME env var had been masking - gemini then 500'd with
    'model is required.'"""
    from app import config

    monkeypatch.setenv("LLM_PROVIDER", "waterfall")
    monkeypatch.delenv("MODEL_NAME", raising=False)
    assert config.model_name("gemini") == config.DEFAULT_MODELS["gemini"]
    assert config.model_name("groq") == config.DEFAULT_MODELS["groq"]
    assert config.model_name("openrouter") == config.DEFAULT_MODELS["openrouter"]
    assert config.model_name("ollama") == config.DEFAULT_MODELS["ollama"]


def test_model_name_env_override_still_wins(monkeypatch):
    from app import config

    monkeypatch.setenv("MODEL_NAME", "my-explicit-model")
    assert config.model_name("gemini") == "my-explicit-model"
    assert config.model_name() == "my-explicit-model"


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
    monkeypatch.setattr(gemini_mod.genai, "Client", _FakeGeminiClient)


def test_gemini_returns_raw_text(monkeypatch, valid_shot_list):
    _patch_gemini(monkeypatch, _FakeGeminiResponse(json.dumps(valid_shot_list)))
    raw = GeminiProvider().generate(SYSTEM, USER, json_mode=True)
    assert json.loads(raw) == valid_shot_list


def test_gemini_429_becomes_rate_limited(monkeypatch):
    exc = gemini_mod.genai_errors.APIError(
        429, {"error": {"message": "quota", "status": "RESOURCE_EXHAUSTED"}}
    )
    _patch_gemini(monkeypatch, exc)
    with pytest.raises(ProviderRateLimited):
        GeminiProvider().generate(SYSTEM, USER)


def test_gemini_500_becomes_provider_error(monkeypatch):
    exc = gemini_mod.genai_errors.APIError(
        500, {"error": {"message": "boom", "status": "INTERNAL"}}
    )
    _patch_gemini(monkeypatch, exc)
    with pytest.raises(ProviderError):
        GeminiProvider().generate(SYSTEM, USER)


def _capture_gemini_kwargs(monkeypatch):
    captured = {}

    class _CapModels:
        def generate_content(self, **kwargs):
            captured.update(kwargs)
            return _FakeGeminiResponse("{}")

    class _CapClient:
        def __init__(self, **kwargs):
            self.models = _CapModels()

    monkeypatch.setattr(gemini_mod.genai, "Client", _CapClient)
    return captured


def test_gemini_no_thinking_config_on_non_25_models(monkeypatch):
    """thinking_budget=0 is a Gemini 2.5-era knob; newer models reject it with
    HTTP 400 (confirmed live on gemini-flash-latest 2026-07-26). Only send it
    to 2.5 models."""
    monkeypatch.delenv("MODEL_NAME", raising=False)
    monkeypatch.setenv("LLM_PROVIDER", "waterfall")  # default: gemini-flash-latest
    captured = _capture_gemini_kwargs(monkeypatch)
    GeminiProvider().generate(SYSTEM, USER, json_mode=True)
    assert captured["config"].thinking_config is None


def test_gemini_keeps_thinking_budget_zero_on_25_flash(monkeypatch):
    monkeypatch.setenv("MODEL_NAME", "gemini-2.5-flash-lite")
    captured = _capture_gemini_kwargs(monkeypatch)
    GeminiProvider().generate(SYSTEM, USER, json_mode=True)
    assert captured["config"].thinking_config.thinking_budget == 0


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
    monkeypatch.setattr(groq_mod.groq_sdk, "Groq", _FakeGroqClient)


def _groq_http_response(status: int) -> httpx.Response:
    request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    return httpx.Response(status, request=request)


def test_groq_returns_raw_text(monkeypatch, valid_shot_list):
    _patch_groq(monkeypatch, json.dumps(valid_shot_list))
    monkeypatch.setenv("GROQ_API_KEY", "test")
    raw = GroqProvider().generate(SYSTEM, USER)
    assert json.loads(raw) == valid_shot_list


def test_groq_429_becomes_rate_limited(monkeypatch):
    exc = groq_mod.groq_sdk.RateLimitError(
        "rate limited", response=_groq_http_response(429), body=None
    )
    _patch_groq(monkeypatch, exc)
    monkeypatch.setenv("GROQ_API_KEY", "test")
    with pytest.raises(ProviderRateLimited):
        GroqProvider().generate(SYSTEM, USER)


def _patch_ollama_post(monkeypatch, handler) -> None:
    monkeypatch.setattr(ollama_mod.httpx, "post", handler)


def test_ollama_returns_response_field(monkeypatch, valid_shot_list):
    def fake_post(url, json=None, timeout=None):
        assert url.endswith("/api/generate")
        assert json["format"] == "json"
        assert json["stream"] is False
        import json as json_mod
        return httpx.Response(
            200,
            request=httpx.Request("POST", url),
            text=json_mod.dumps({"response": json_mod.dumps(valid_shot_list)}),
        )

    _patch_ollama_post(monkeypatch, fake_post)
    raw = OllamaProvider().generate(SYSTEM, USER)
    assert json.loads(raw) == valid_shot_list


def test_ollama_missing_model_gives_pull_hint(monkeypatch):
    def fake_post(url, json=None, timeout=None):
        return httpx.Response(404, request=httpx.Request("POST", url))

    _patch_ollama_post(monkeypatch, fake_post)
    with pytest.raises(ProviderError, match="ollama pull"):
        OllamaProvider().generate(SYSTEM, USER)


def test_ollama_unreachable_gives_install_hint(monkeypatch):
    def fake_post(url, json=None, timeout=None):
        raise httpx.ConnectError("connection refused")

    _patch_ollama_post(monkeypatch, fake_post)
    with pytest.raises(ProviderError, match="ollama.com"):
        OllamaProvider().generate(SYSTEM, USER)


def test_json_mode_false_omits_gemini_mime(monkeypatch):
    captured = {}

    class _CapModels:
        def generate_content(self, **kwargs):
            captured["config"] = kwargs["config"]
            return _FakeGeminiResponse("{}")

    class _CapClient:
        def __init__(self, **kwargs):
            self.models = _CapModels()

    monkeypatch.setattr(gemini_mod.genai, "Client", _CapClient)
    GeminiProvider().generate(SYSTEM, USER, json_mode=False)
    assert captured["config"].response_mime_type is None


# ── Waterfall: a HANGING provider must not starve every later call ────────────
# Regression for the 2026-08-07 promote outage. OpenRouter sat first in
# WATERFALL_ORDER and ran to LLM_TIMEOUT_SECONDS (120s) on every call instead of
# failing fast. ProviderTimeout was classified transient, so the dead-provider
# cooldown never engaged and EVERY chunk re-paid the full 120s. With
# SSE_WAIT_TIMEOUT=180 for the whole promote stream, three chunks starved and the
# writer saw "Timed out waiting for chunks" after ~3 minutes.

def _waterfall_with(monkeypatch, order, builders):
    """Point the waterfall at fake providers and reset its cooldown state."""
    from app.providers import waterfall as wf

    wf._dead.clear()
    wf._timeout_streak.clear()
    monkeypatch.setattr(wf.config, "waterfall_order", lambda: list(order))
    monkeypatch.setattr(wf, "_build_provider", lambda name: builders.get(name))
    return wf


class _AlwaysTimesOut:
    """Stands in for OpenRouter-on-a-free-model: never errors, just burns time."""

    def __init__(self):
        self.calls = 0

    def generate(self, system_prompt, user_content, json_mode=True):
        from app.providers.base import ProviderTimeout

        self.calls += 1
        raise ProviderTimeout("Request timed out after 120s")


class _AlwaysWorks:
    def __init__(self):
        self.calls = 0

    def generate(self, system_prompt, user_content, json_mode=True):
        self.calls += 1
        return "{}"


def test_repeated_timeouts_cool_a_provider_down(monkeypatch):
    """After the streak limit, a reliably-timing-out provider is skipped
    entirely — later calls must not pay its timeout again."""
    from app.providers.waterfall import (
        TIMEOUT_STREAK_LIMIT, WaterfallProvider,
    )

    slow, fast = _AlwaysTimesOut(), _AlwaysWorks()
    _waterfall_with(monkeypatch, ["slowpoke", "goodguy"],
                    {"slowpoke": slow, "goodguy": fast})

    w = WaterfallProvider()
    for _ in range(TIMEOUT_STREAK_LIMIT + 3):
        assert w.generate(SYSTEM, USER) == "{}"

    # It may only be tried up to the streak limit; after that it's cooled down.
    assert slow.calls == TIMEOUT_STREAK_LIMIT, (
        f"timing-out provider was called {slow.calls}x; "
        f"expected it to stop at {TIMEOUT_STREAK_LIMIT}"
    )
    assert fast.calls == TIMEOUT_STREAK_LIMIT + 3


def test_a_success_resets_the_timeout_streak(monkeypatch):
    """One-off timeouts must NOT sideline a healthy provider — the streak only
    counts CONSECUTIVE timeouts."""
    from app.providers.base import ProviderTimeout
    from app.providers.waterfall import WaterfallProvider

    class _FlakyThenFine:
        def __init__(self):
            self.calls = 0

        def generate(self, system_prompt, user_content, json_mode=True):
            self.calls += 1
            if self.calls % 2 == 1:      # timeout, ok, timeout, ok ...
                raise ProviderTimeout("Request timed out after 120s")
            return '{"ok": true}'

    flaky, fast = _FlakyThenFine(), _AlwaysWorks()
    _waterfall_with(monkeypatch, ["flaky", "goodguy"],
                    {"flaky": flaky, "goodguy": fast})

    w = WaterfallProvider()
    for _ in range(6):
        w.generate(SYSTEM, USER)

    # Alternating timeouts never reach the streak limit, so it is never cooled
    # down and keeps serving every other call itself.
    assert flaky.calls == 6, f"healthy-but-flaky provider was sidelined after {flaky.calls} calls"


def test_a_trickling_provider_is_cut_off_by_the_wall_clock_deadline(monkeypatch):
    """THE 2026-08-07 PROMOTE OUTAGE, exactly.

    OpenRouter returned 200 headers in ~5s then dribbled the response body for
    8+ minutes. httpx's `read` timeout is PER SOCKET READ, not a total deadline,
    so a peer that sends any byte before it expires resets it forever — the
    120s LLM_TIMEOUT_SECONDS never fired, no ProviderTimeout was ever raised,
    the waterfall never fell through, and the promote stream starved.

    A leg must not be able to outlive the whole stream's budget."""
    import time as _time

    from app.providers.base import ProviderTimeout
    from app.providers.waterfall import PROVIDER_DEADLINE_SECONDS, WaterfallProvider

    class _Trickler:
        """Never raises. Never returns in time. Exactly like a slow-loris body."""
        def __init__(self):
            self.calls = 0

        def generate(self, system_prompt, user_content, json_mode=True):
            self.calls += 1
            _time.sleep(PROVIDER_DEADLINE_SECONDS + 30)
            return "{}"

    slow, fast = _Trickler(), _AlwaysWorks()
    _waterfall_with(monkeypatch, ["trickler", "goodguy"],
                    {"trickler": slow, "goodguy": fast})
    monkeypatch.setattr("app.providers.waterfall.PROVIDER_DEADLINE_SECONDS", 1.0)

    t0 = _time.time()
    assert WaterfallProvider().generate(SYSTEM, USER) == "{}"
    elapsed = _time.time() - t0

    # It must give up on the trickler and serve from the healthy leg promptly.
    assert elapsed < 10, f"waterfall waited {elapsed:.1f}s on a trickling leg"
    assert fast.calls == 1
