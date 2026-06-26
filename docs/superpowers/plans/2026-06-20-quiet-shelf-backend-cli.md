# Quiet Shelf — Backend + CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure this repo (the working "Quiet Fight Club" Promote backend) in place into the three-service Quiet Shelf layout — Format (EPUB), Blurb (marketing copy), Promote (shot list) — under one FastAPI app, plus a Typer CLI.

**Architecture:** Three self-contained service packages under `app/services/` that never import each other. The only shared code is `app/providers/` (the pluggable LLM layer used by Blurb + Promote) and app-level infra (`config.py`, `deps.py`, `http_errors.py`, `ratelimit.py`). Format uses no LLM. Provider selection is env-driven (gemini default, groq, ollama), all free.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic v2, uvicorn, `pypandoc_binary` (bundles pandoc) for EPUB, `python-docx` + `striprtf` for reading manuscripts, `Pillow` for typographic covers, `google-genai`/`groq`/`httpx` providers, Typer + Rich CLI, pytest.

**Spec:** `docs/superpowers/specs/2026-06-20-quiet-shelf-backend-cli-design.md`

---

## Grounding refinements (decided, within approved design)

- **`pypandoc_binary`** bundles the pandoc executable → no system pandoc dependency on Windows dev or in Docker. The Dockerfile no longer needs `apt-get pandoc`.
- **RTF reading in Format**: pandoc cannot *read* RTF (RTF is an output-only format in pandoc). RTF is converted via `striprtf` → markdown, so it loses rich structure but still produces a themed EPUB. DOCX is the rich path; RTF/TXT lean on the theme — consistent with the spec's TXT handling.
- **Standardized LLM error contract** (Blurb + Promote share it via `app/http_errors.py`): parse failure → 502 `generation_failed`; rate limit → 429 `rate_limited`; timeout → 504 `timeout`; upstream → 502 `upstream_error`.

---

## File Structure

**Providers package (shared LLM layer)**
- `app/providers/__init__.py` — re-exports the public surface (provider classes, errors, `get_provider`, `validate_startup`, `generate_json`, `JSONParseError`).
- `app/providers/base.py` — `Provider` ABC with `generate(system_prompt, user_content, json_mode=True)`, error types.
- `app/providers/gemini.py`, `groq.py`, `ollama.py` — one provider each.
- `app/providers/registry.py` — `_PROVIDERS`, `get_provider()`, `validate_startup()`.
- `app/providers/json_engine.py` — `generate_json(system, user, Model)`, `_extract_json`, `RETRY_INSTRUCTION`, `JSONParseError`.

**App infra**
- `app/config.py` — extended settings.
- `app/ratelimit.py` — unchanged.
- `app/deps.py` — FastAPI deps: access-code, rate-limit, client-IP.
- `app/http_errors.py` — `llm_error_to_response(exc, *, failure_code, failure_msg)`.
- `app/main.py` — mounts 3 routers, serves frontend, health, lifespan provider check.
- `app/cli.py` — Typer + Rich CLI.

**Services**
- `app/services/promote/{__init__,models,mapper,router}.py` — migrated from `app/{models,prompt,mapping}.py`.
- `app/services/format/{__init__,models,themes,cover,converter,router}.py` + `app/services/format/theme_assets/` (CSS + fonts).
- `app/services/blurb/{__init__,models,extract,generator,router}.py`.

**Deleted after migration**: `app/providers.py`, `app/mapping.py`, `app/prompt.py`, `app/models.py`, `qfc/` package.

**Tests**: `tests/test_providers.py` (rewritten), `tests/test_json_engine.py` (was test_parsing), `tests/test_promote.py`, `tests/test_format.py`, `tests/test_blurb.py`, `tests/test_infra.py` (was test_validation), `tests/conftest.py` (extended).

---

## Phase 0 — Foundations

### Task 0: Dependencies and pandoc availability

**Files:**
- Modify: `requirements.txt`
- Modify: `requirements-dev.txt`

- [ ] **Step 1: Update `requirements.txt` to exactly:**

```
fastapi==0.136.3
uvicorn[standard]==0.49.0
pydantic==2.13.4
python-dotenv==1.2.2
google-genai==2.8.0
groq==1.4.0
httpx==0.28.1
typer==0.15.1
rich==13.9.4
pypandoc_binary==1.15
python-docx==1.1.2
striprtf==0.0.29
Pillow==11.1.0
```

- [ ] **Step 2: Update `requirements-dev.txt` to exactly:**

```
-r requirements.txt
pytest==9.0.3
```

- [ ] **Step 3: Install and verify pandoc is reachable through pypandoc**

Run: `python -m pip install -r requirements-dev.txt`
Then run: `python -c "import pypandoc; print(pypandoc.get_pandoc_version())"`
Expected: prints a version like `3.x.x` (the bundled binary). If it errors, run `python -c "import pypandoc; pypandoc.download_pandoc()"` once.

- [ ] **Step 4: Commit**

```
git add requirements.txt requirements-dev.txt
git commit -m "build: add Quiet Shelf deps (typer, pypandoc, docx, striprtf, pillow)"
```

---

## Phase A — Providers refactor + Promote migration

### Task A1: Provider base + error types

**Files:**
- Create: `app/providers/__init__.py` (temporary minimal; finalized in A5)
- Create: `app/providers/base.py`
- Test: `tests/test_providers.py` (rewrite begins here)

- [ ] **Step 1: Create `app/providers/base.py`**

```python
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
```

- [ ] **Step 2: Create a temporary `app/providers/__init__.py`** (finalized in A5)

```python
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)

__all__ = [
    "Provider",
    "ProviderConfigError",
    "ProviderError",
    "ProviderRateLimited",
    "ProviderTimeout",
]
```

- [ ] **Step 3: Delete the old flat module so the package takes over**

Run: `git rm app/providers.py`
Expected: file staged for deletion. (Its provider classes are recreated in A2.)

- [ ] **Step 4: Commit**

```
git add app/providers/__init__.py app/providers/base.py
git commit -m "refactor: introduce providers package with generic Provider.generate()"
```

### Task A2: The three providers on the generic interface

**Files:**
- Create: `app/providers/gemini.py`, `app/providers/groq.py`, `app/providers/ollama.py`
- Test: `tests/test_providers.py`

- [ ] **Step 1: Write the failing test file `tests/test_providers.py`** (full rewrite)

```python
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


# --- ollama --------------------------------------------------------------------

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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python -m pytest tests/test_providers.py -q`
Expected: collection/import errors — `app.providers.gemini` etc. do not exist yet.

- [ ] **Step 3: Create `app/providers/gemini.py`**

```python
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
                ),
            )
        except genai_errors.APIError as exc:
            if exc.code == 429:
                raise ProviderRateLimited(str(exc)) from exc
            raise ProviderError(f"Gemini API error (HTTP {exc.code})") from exc
        except httpx.TimeoutException as exc:
            raise ProviderTimeout(str(exc)) from exc
        return response.text or ""
```

- [ ] **Step 4: Create `app/providers/groq.py`**

```python
"""Groq free tier via the groq SDK - open models (Llama 3.x) at high speed."""
from __future__ import annotations

import groq as groq_sdk

from app import config
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)


class GroqProvider(Provider):
    name = "groq"

    def validate_config(self) -> None:
        if not config.groq_api_key():
            raise ProviderConfigError(
                "GROQ_API_KEY is not set. Get a free key (no card needed) at "
                "https://console.groq.com, put it in your .env file, and "
                "restart. Or switch providers with LLM_PROVIDER=gemini|ollama."
            )

    def generate(
        self, system_prompt: str, user_content: str, json_mode: bool = True
    ) -> str:
        client = groq_sdk.Groq(
            api_key=config.groq_api_key(),
            timeout=config.LLM_TIMEOUT_SECONDS,
            max_retries=0,
        )
        kwargs = {
            "model": config.model_name(),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        }
        if json_mode:
            # JSON mode requires the word "JSON" in the prompt; system prompts do.
            kwargs["response_format"] = {"type": "json_object"}
        try:
            response = client.chat.completions.create(**kwargs)
        except groq_sdk.RateLimitError as exc:
            raise ProviderRateLimited(str(exc)) from exc
        except groq_sdk.APITimeoutError as exc:
            raise ProviderTimeout(str(exc)) from exc
        except groq_sdk.APIError as exc:
            raise ProviderError(f"Groq API error: {type(exc).__name__}") from exc
        return response.choices[0].message.content or ""
```

- [ ] **Step 5: Create `app/providers/ollama.py`**

```python
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
```

- [ ] **Step 6: Create `app/providers/registry.py`**

```python
"""Provider registry: select and validate the configured provider."""
from __future__ import annotations

from app import config
from app.providers.base import Provider, ProviderConfigError
from app.providers.gemini import GeminiProvider
from app.providers.groq import GroqProvider
from app.providers.ollama import OllamaProvider

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
```

- [ ] **Step 7: Replace `app/providers/__init__.py` with the fuller surface** (json_engine added in A4)

```python
from app.providers.base import (
    Provider,
    ProviderConfigError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)
from app.providers.gemini import GeminiProvider
from app.providers.groq import GroqProvider
from app.providers.ollama import OllamaProvider
from app.providers.registry import get_provider, validate_startup

__all__ = [
    "Provider",
    "ProviderConfigError",
    "ProviderError",
    "ProviderRateLimited",
    "ProviderTimeout",
    "GeminiProvider",
    "GroqProvider",
    "OllamaProvider",
    "get_provider",
    "validate_startup",
]
```

- [ ] **Step 8: Run the provider tests**

Run: `python -m pytest tests/test_providers.py -q`
Expected: PASS (all provider tests green).

- [ ] **Step 9: Commit**

```
git add app/providers tests/test_providers.py
git commit -m "refactor: port gemini/groq/ollama to generic generate() interface"
```

### Task A4: JSON engine (shared parse + retry)

**Files:**
- Create: `app/providers/json_engine.py`
- Modify: `app/providers/__init__.py`
- Test: `tests/test_json_engine.py`

- [ ] **Step 1: Write `tests/test_json_engine.py`**

```python
"""Defensive JSON parsing + one-retry tests, provider mocked at the seam."""
from __future__ import annotations

import json

import pytest
from pydantic import BaseModel

from app.providers import json_engine
from app.providers.json_engine import JSONParseError, _extract_json, generate_json


class _Model(BaseModel):
    a: int
    b: str


def _patch_provider(monkeypatch, *responses):
    """Make get_provider() return a fake whose generate() yields each response."""
    calls = {"n": 0, "systems": []}

    class _Fake:
        name = "fake"

        def generate(self, system_prompt, user_content, json_mode=True):
            calls["systems"].append(system_prompt)
            i = calls["n"]
            calls["n"] += 1
            value = responses[min(i, len(responses) - 1)]
            if isinstance(value, Exception):
                raise value
            return value

    monkeypatch.setattr(json_engine, "get_provider", lambda: _Fake())
    return calls


def test_extract_plain_json():
    assert _extract_json('{"a": 1, "b": "x"}') == {"a": 1, "b": "x"}


def test_extract_strips_markdown_fences():
    assert _extract_json('```json\n{"a": 1, "b": "x"}\n```') == {"a": 1, "b": "x"}


def test_extract_tolerates_surrounding_commentary():
    chatty = 'Sure!\n{"a": 1, "b": "x"}\nHope that helps!'
    assert _extract_json(chatty) == {"a": 1, "b": "x"}


def test_extract_raises_on_garbage():
    with pytest.raises(ValueError):
        _extract_json("I'm sorry, I can't do that.")


def test_generate_json_happy_path(monkeypatch):
    _patch_provider(monkeypatch, '{"a": 1, "b": "x"}')
    result = generate_json("system", "user", _Model)
    assert result == _Model(a=1, b="x")


def test_generate_json_retries_once_then_succeeds(monkeypatch):
    calls = _patch_provider(monkeypatch, "not json", '{"a": 2, "b": "y"}')
    result = generate_json("system", "user", _Model)
    assert result == _Model(a=2, b="y")
    # Second call carries the retry instruction appended to the system prompt.
    assert calls["systems"][0] == "system"
    assert json_engine.RETRY_INSTRUCTION in calls["systems"][1]


def test_generate_json_fails_after_two_bad_responses(monkeypatch):
    _patch_provider(monkeypatch, "still not json")
    with pytest.raises(JSONParseError):
        generate_json("system", "user", _Model)


def test_generate_json_schema_violation_triggers_retry_then_fails(monkeypatch):
    _patch_provider(monkeypatch, '{"wrong": "shape"}')
    with pytest.raises(JSONParseError):
        generate_json("system", "user", _Model)
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m pytest tests/test_json_engine.py -q`
Expected: FAIL — `app.providers.json_engine` does not exist.

- [ ] **Step 3: Create `app/providers/json_engine.py`**

```python
"""Shared defensive JSON generation: call the provider, parse, retry once.

Blurb and Promote both call generate_json. This is the only place the
parse/retry logic lives. Secrets and content are never logged - only counts.
"""
from __future__ import annotations

import json
import logging
import re
import time
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from app.providers.registry import get_provider

logger = logging.getLogger("quietshelf.json_engine")

T = TypeVar("T", bound=BaseModel)

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)

RETRY_INSTRUCTION = (
    "\n\nIMPORTANT: Your previous response could not be parsed. "
    "Respond with ONLY a single valid JSON object - no markdown fences, "
    "no commentary, no text before or after the JSON."
)


class JSONParseError(Exception):
    """The model returned an unparseable result twice in a row."""


def _extract_json(raw: str) -> dict:
    """Strip markdown fences / surrounding chatter and parse the JSON object."""
    text = _FENCE_RE.sub("", raw).strip()
    if not text.startswith("{"):
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("no JSON object found in model output")
        text = text[start : end + 1]
    return json.loads(text)


def generate_json(system_prompt: str, user_content: str, model: type[T]) -> T:
    """Generate JSON matching `model`. Retries once on unparseable output;
    raises JSONParseError if it fails twice."""
    started = time.monotonic()
    for attempt, retry in enumerate((False, True), start=1):
        system = system_prompt + RETRY_INSTRUCTION if retry else system_prompt
        raw = get_provider().generate(system, user_content, json_mode=True)
        try:
            result = model.model_validate(_extract_json(raw))
        except (ValueError, ValidationError) as exc:
            logger.warning("parse_failed attempt=%d error=%s", attempt, type(exc).__name__)
            continue
        logger.info(
            "generate_json_ok model=%s duration_ms=%d attempt=%d",
            model.__name__,
            int((time.monotonic() - started) * 1000),
            attempt,
        )
        return result
    raise JSONParseError("model output was unparseable after one retry")
```

- [ ] **Step 4: Add json_engine exports to `app/providers/__init__.py`**

Append these imports and `__all__` entries to `app/providers/__init__.py`:

```python
from app.providers.json_engine import JSONParseError, generate_json
```

And add `"JSONParseError"`, `"generate_json"` to the `__all__` list.

- [ ] **Step 5: Run tests**

Run: `python -m pytest tests/test_json_engine.py tests/test_providers.py -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```
git add app/providers/json_engine.py app/providers/__init__.py tests/test_json_engine.py
git commit -m "feat: shared generate_json engine (parse + one retry) in providers"
```

### Task A5: Config updates + shared HTTP error helper

**Files:**
- Modify: `app/config.py`
- Create: `app/http_errors.py`
- Create: `app/deps.py`
- Test: `tests/test_infra.py` (created in D-phase; config covered indirectly)

- [ ] **Step 1: Rewrite `app/config.py`**

```python
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
    return int(os.getenv("RATE_LIMIT", str(DEFAULT_RATE_LIMIT)))


def max_upload_mb() -> int:
    return int(os.getenv("MAX_UPLOAD_MB", str(DEFAULT_MAX_UPLOAD_MB)))
```

- [ ] **Step 2: Create `app/http_errors.py`**

```python
"""Map provider/parse exceptions to friendly JSON responses. Shared by the
Blurb and Promote routers (Format uses no LLM). A stressed writer never sees a
raw stack trace."""
from __future__ import annotations

import logging

from fastapi.responses import JSONResponse

from app.providers import (
    JSONParseError,
    ProviderError,
    ProviderRateLimited,
    ProviderTimeout,
)

logger = logging.getLogger("quietshelf.errors")


def llm_error_to_response(
    exc: Exception, *, failure_code: str, failure_msg: str
) -> JSONResponse:
    """Translate a known LLM-path exception into a JSONResponse. Re-raise if
    the exception is not one we handle."""
    if isinstance(exc, JSONParseError):
        return JSONResponse(
            status_code=502, content={"error": failure_code, "message": failure_msg}
        )
    if isinstance(exc, ProviderRateLimited):
        logger.warning("provider_rate_limited")
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limited",
                "message": "The free AI tier needs a breather. Try again in a minute.",
            },
        )
    if isinstance(exc, ProviderTimeout):
        logger.error("provider_timeout")
        return JSONResponse(
            status_code=504,
            content={
                "error": "timeout",
                "message": "The AI took too long (over 120 seconds). Try again, or use a shorter piece.",
            },
        )
    if isinstance(exc, ProviderError):
        logger.error("provider_error detail=%s", exc)
        return JSONResponse(
            status_code=502,
            content={
                "error": "upstream_error",
                "message": "The AI is unavailable right now. Try again in a minute.",
            },
        )
    raise exc
```

- [ ] **Step 3: Create `app/deps.py`**

```python
"""App-level FastAPI dependencies shared by routers: access-code gate, rate
limiting, client-IP resolution. This is app infrastructure, not service code."""
from __future__ import annotations

from fastapi import HTTPException, Request

from app import config
from app.ratelimit import RateLimiter

_rate_limiter = RateLimiter(limit=config.rate_limit_per_hour())


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def require_access(request: Request) -> None:
    expected = config.access_code()
    if expected and request.headers.get("x-access-code") != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing access code.")


def enforce_rate_limit(request: Request) -> None:
    ip = client_ip(request)
    if not _rate_limiter.allow(ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again later.",
            headers={"Retry-After": str(_rate_limiter.retry_after_seconds(ip))},
        )


def guard(request: Request) -> None:
    """Single dependency applied to every service endpoint."""
    require_access(request)
    enforce_rate_limit(request)
```

- [ ] **Step 4: Commit**

```
git add app/config.py app/http_errors.py app/deps.py
git commit -m "feat: config additions, shared LLM error mapper, request guard deps"
```

### Task A6: Migrate Promote into a self-contained service

**Files:**
- Create: `app/services/__init__.py`, `app/services/promote/__init__.py`, `app/services/promote/models.py`, `app/services/promote/mapper.py`, `app/services/promote/router.py`
- Delete: `app/models.py`, `app/prompt.py`, `app/mapping.py`
- Test: `tests/test_promote.py`

- [ ] **Step 1: Write `tests/test_promote.py`**

```python
"""Promote service: validation, parsing, and endpoint shape."""
from __future__ import annotations

import json

import pytest

from app.providers.json_engine import JSONParseError


@pytest.fixture()
def _ok(monkeypatch, valid_shot_list):
    """Patch the mapper's generate_json to return a valid shot list."""
    from app.services.promote import mapper
    from app.services.promote.models import ShotList

    monkeypatch.setattr(
        mapper, "generate_json",
        lambda system, user, model: ShotList.model_validate(valid_shot_list),
    )


def test_map_script_happy_path(_ok, valid_script):
    from app.services.promote.mapper import map_script
    result = map_script(valid_script)
    assert result.video_title_suggestion == "A Test Title"
    assert len(result.segments) == 1


def test_endpoint_returns_validated_shape(client, _ok, valid_script):
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"video_title_suggestion", "estimated_runtime_seconds", "segments"}
    segment = body["segments"][0]
    assert set(segment) == {
        "id", "script_text", "start_time", "end_time",
        "search_terms", "clip_duration_seconds", "mood",
    }


def test_endpoint_502_on_parse_failure(client, valid_script, monkeypatch):
    from app.services.promote import mapper

    def boom(system, user, model):
        raise JSONParseError("nope")

    monkeypatch.setattr(mapper, "generate_json", boom)
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 502
    assert response.json()["error"] == "generation_failed"


def test_empty_script_rejected(client):
    response = client.post("/api/promote", json={"script": ""})
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_short_script_rejected(client):
    response = client.post("/api/promote", json={"script": "only a few words here"})
    assert response.status_code == 422
    assert "100 words" in response.json()["detail"]


def test_long_script_rejected(client):
    response = client.post("/api/promote", json={"script": "word " * 3001})
    assert response.status_code == 422
    assert "too long" in response.json()["detail"].lower()
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m pytest tests/test_promote.py -q`
Expected: FAIL — `app.services.promote` does not exist.

- [ ] **Step 3: Create `app/services/__init__.py`** (empty) and `app/services/promote/__init__.py`** (empty).

- [ ] **Step 4: Create `app/services/promote/models.py`**

```python
"""Promote response contract."""
from __future__ import annotations

from pydantic import BaseModel, Field


class PromoteRequest(BaseModel):
    script: str = Field(..., description="Full script text, 100-3000 words.")


class Segment(BaseModel):
    id: int
    script_text: str
    start_time: str
    end_time: str
    search_terms: list[str]
    clip_duration_seconds: int
    mood: str


class ShotList(BaseModel):
    video_title_suggestion: str
    estimated_runtime_seconds: int
    segments: list[Segment]
```

- [ ] **Step 5: Create `app/services/promote/mapper.py`** (prompt + call)

```python
"""Promote engine: the baked-in visual-mapping prompt + one generate_json call."""
from __future__ import annotations

from app.providers import generate_json
from app.services.promote.models import ShotList

SYSTEM_PROMPT = """\
You are a visual mapping engine for video essays that use stock footage.

You receive a full script. Narration pace is ~150 words per minute.

Break the ENTIRE script into visual segments (every 1-3 sentences, wherever the on-screen visual should change). For each segment provide:

- id: sequential integer starting at 1
- script_text: the exact sentences from the script (do not paraphrase)
- start_time and end_time: cumulative narration timing as "M:SS" strings
- search_terms: exactly 3 stock-footage search terms, ranked best first. Terms must be optimized for stock libraries like Pexels: simple, concrete, describing actions/settings/emotions ("man walking alone city night"), never abstract concepts ("loneliness of modern existence"). Prefer terms with high stock availability - avoid hyper-specific scenes that won't exist.
- clip_duration_seconds: integer estimate based on narration pace
- mood: one or two lowercase words (e.g., "hopeful", "tense", "warm")

Also provide:

- video_title_suggestion: a working title drawn from the script's theme
- estimated_runtime_seconds: total narration time as an integer

Cover the COMPLETE script start to finish. Never summarize, skip, or stop early.

Respond with ONLY a valid JSON object matching this structure. No markdown fences, no commentary, no preamble.
"""


def map_script(script: str) -> ShotList:
    """Map a script to a validated shot list."""
    return generate_json(SYSTEM_PROMPT, script, ShotList)
```

- [ ] **Step 6: Create `app/services/promote/router.py`**

```python
"""Promote endpoint: POST /api/promote."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app import config
from app.deps import guard
from app.http_errors import llm_error_to_response
from app.providers import JSONParseError, ProviderError
from app.services.promote.mapper import map_script
from app.services.promote.models import PromoteRequest, ShotList

logger = logging.getLogger("quietshelf.promote")

router = APIRouter(prefix="/api", tags=["promote"])


@router.post("/promote", response_model=ShotList)
def promote(body: PromoteRequest, request: Request, _: None = Depends(guard)):
    word_count = len(body.script.split())
    if word_count == 0:
        raise HTTPException(status_code=422, detail="Script is empty. Paste your script text and try again.")
    if word_count < config.MIN_WORDS:
        raise HTTPException(
            status_code=422,
            detail=f"Script too short - needs at least {config.MIN_WORDS} words (got {word_count}).",
        )
    if word_count > config.MAX_WORDS:
        raise HTTPException(status_code=422, detail="Script too long - split it into parts.")

    logger.info("promote_request word_count=%d provider=%s", word_count, config.provider_name())
    try:
        return map_script(body.script)
    except (JSONParseError, ProviderError) as exc:
        return llm_error_to_response(
            exc,
            failure_code="generation_failed",
            failure_msg="The mapping engine returned an unreadable result. Try again.",
        )
```

- [ ] **Step 7: Delete the old flat modules**

Run:
```
git rm app/models.py app/prompt.py app/mapping.py tests/test_parsing.py tests/test_validation.py
```
Expected: staged for deletion. (test_parsing → replaced by test_json_engine; test_validation → replaced by test_promote + test_infra in Phase D. The old `app/main.py` still imports these; it is rewritten in Task D2. Until then the full suite will not import main — run only the targeted test files in Step 8.)

- [ ] **Step 8: Run the promote + engine + provider tests**

Run: `python -m pytest tests/test_promote.py tests/test_json_engine.py tests/test_providers.py -q`
Expected: `test_promote.py` tests that need `client` will ERROR for now (the `client` fixture imports `app.main`, which still references deleted modules). Run instead the non-client tests:
Run: `python -m pytest tests/test_promote.py::test_map_script_happy_path tests/test_json_engine.py tests/test_providers.py -q`
Expected: PASS. (Full client-based promote tests pass after Task D2.)

- [ ] **Step 9: Commit**

```
git add app/services tests/test_promote.py
git commit -m "refactor: migrate Promote into self-contained service at /api/promote"
```

---

## Phase B — Format service (no LLM)

### Task B1: Format models + theme registry

**Files:**
- Create: `app/services/format/__init__.py` (empty), `app/services/format/models.py`, `app/services/format/themes.py`
- Test: `tests/test_format.py` (begins here)

- [ ] **Step 1: Write `tests/test_format.py` theme portion**

```python
"""Format service tests: themes, cover, conversion, validation."""
from __future__ import annotations

from app.services.format.themes import THEMES, Theme, get_theme


def test_four_themes_registered():
    assert set(Theme) == {Theme.classic, Theme.cozy, Theme.modern, Theme.children}
    assert len(THEMES) == 4


def test_each_theme_has_display_name_css_and_existing_font():
    for theme in Theme:
        spec = get_theme(theme)
        assert spec.display_name
        assert spec.description
        assert spec.css_path.is_file(), f"missing css for {theme}"
        assert spec.font_paths, f"no fonts for {theme}"
        for font in spec.font_paths:
            assert font.is_file(), f"missing font {font} for {theme}"


def test_get_theme_rejects_unknown():
    import pytest
    with pytest.raises(KeyError):
        get_theme("nonsense")  # type: ignore[arg-type]
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m pytest tests/test_format.py -q`
Expected: FAIL — module missing.

- [ ] **Step 3: Create `app/services/format/models.py`**

```python
"""Format request/response models and the Theme enum."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class Theme(str, Enum):
    classic = "classic"
    cozy = "cozy"
    modern = "modern"
    children = "children"


class ThemeInfo(BaseModel):
    id: Theme
    display_name: str
    description: str


class ThemeList(BaseModel):
    themes: list[ThemeInfo]
```

- [ ] **Step 4: Create `app/services/format/themes.py`**

```python
"""Theme registry: each theme is a display name + description + CSS + OFL font
files. CSS and fonts live under theme_assets/. Source Serif 4 and Newsreader
are reused from the repo's existing vendored fonts; EB Garamond and Quicksand
are vendored under theme_assets/fonts/ (all OFL, free for commercial use)."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.services.format.models import Theme

ASSETS = Path(__file__).resolve().parent / "theme_assets"
CSS_DIR = ASSETS / "css"
FONT_DIR = ASSETS / "fonts"


@dataclass(frozen=True)
class ThemeSpec:
    id: Theme
    display_name: str
    description: str
    css_path: Path
    font_paths: tuple[Path, ...]


THEMES: dict[Theme, ThemeSpec] = {
    Theme.classic: ThemeSpec(
        Theme.classic,
        "Classic Literary",
        "Warm, timeless serif. The look of a hardback novel.",
        CSS_DIR / "classic.css",
        (FONT_DIR / "EBGaramond-Regular.ttf", FONT_DIR / "EBGaramond-Italic.ttf"),
    ),
    Theme.cozy: ThemeSpec(
        Theme.cozy,
        "Cozy",
        "Soft, gentle serif for mellow and emotional stories.",
        CSS_DIR / "cozy.css",
        (FONT_DIR / "Newsreader-Regular.ttf", FONT_DIR / "Newsreader-Italic.ttf"),
    ),
    Theme.modern: ThemeSpec(
        Theme.modern,
        "Modern Clean",
        "Crisp, humanist serif. Clean and contemporary.",
        CSS_DIR / "modern.css",
        (FONT_DIR / "SourceSerif4-Regular.ttf", FONT_DIR / "SourceSerif4-Italic.ttf"),
    ),
    Theme.children: ThemeSpec(
        Theme.children,
        "Children's",
        "Rounded, friendly face for younger readers.",
        CSS_DIR / "children.css",
        (FONT_DIR / "Quicksand-Regular.ttf", FONT_DIR / "Quicksand-Bold.ttf"),
    ),
}


def get_theme(theme: Theme) -> ThemeSpec:
    if theme not in THEMES:
        raise KeyError(f"unknown theme: {theme}")
    return THEMES[theme]
```

- [ ] **Step 5: Vendor the fonts** into `app/services/format/theme_assets/fonts/`

Download the TTF files (all OFL, free for commercial use) so these exact paths exist:
- `EBGaramond-Regular.ttf`, `EBGaramond-Italic.ttf` — from https://github.com/octaviopardo/EBGaramond12 (releases) or Google Fonts.
- `Newsreader-Regular.ttf`, `Newsreader-Italic.ttf` — from Google Fonts (Newsreader).
- `SourceSerif4-Regular.ttf`, `SourceSerif4-Italic.ttf` — from https://github.com/adobe-fonts/source-serif (OFL).
- `Quicksand-Regular.ttf`, `Quicksand-Bold.ttf` — from Google Fonts (Quicksand).

Use TTF (not woff2) — pandoc embeds and Pillow loads TTF/OTF. Verify each downloaded file's license is OFL before committing. Place each `LICENSE`/`OFL.txt` alongside under `theme_assets/fonts/licenses/`.

Run to confirm all eight exist:
```
python -c "from app.services.format.themes import THEMES, get_theme; [print(p, p.is_file()) for t in THEMES for p in get_theme(t).font_paths]"
```
Expected: every line ends `True`.

- [ ] **Step 6: Create the four CSS files** under `app/services/format/theme_assets/css/`. Each embeds its font via `@font-face` (path relative to the EPUB's text directory: `../fonts/<file>`) and styles the manuscript. Create `classic.css`:

```css
@font-face {
  font-family: "BodySerif";
  src: url("../fonts/EBGaramond-Regular.ttf");
  font-weight: normal; font-style: normal;
}
@font-face {
  font-family: "BodySerif";
  src: url("../fonts/EBGaramond-Italic.ttf");
  font-weight: normal; font-style: italic;
}
body {
  font-family: "BodySerif", "Georgia", serif;
  font-size: 1em; line-height: 1.5;
  margin: 1.2em 1.4em; text-align: justify; hyphens: auto;
}
h1, h2 {
  font-family: "BodySerif", serif; font-weight: normal;
  text-align: center; margin: 2em 0 1.2em; page-break-before: always;
  letter-spacing: 0.04em;
}
p { margin: 0; text-indent: 1.4em; }
p:first-of-type, h1 + p, h2 + p { text-indent: 0; }
p:first-of-type::first-letter {
  font-size: 3.2em; line-height: 0.9; float: left;
  padding: 0.02em 0.06em 0 0; font-weight: normal;
}
blockquote { margin: 1em 2em; font-style: italic; }
```

Create `cozy.css` (Newsreader; softer, spaced paragraphs, no drop cap):

```css
@font-face { font-family: "BodySerif"; src: url("../fonts/Newsreader-Regular.ttf"); font-weight: normal; font-style: normal; }
@font-face { font-family: "BodySerif"; src: url("../fonts/Newsreader-Italic.ttf"); font-weight: normal; font-style: italic; }
body { font-family: "BodySerif", Georgia, serif; font-size: 1.05em; line-height: 1.65; margin: 1.4em 1.5em; text-align: left; }
h1, h2 { font-family: "BodySerif", serif; font-weight: normal; text-align: center; margin: 2.2em 0 1.4em; page-break-before: always; }
p { margin: 0 0 0.9em; text-indent: 0; }
blockquote { margin: 1em 1.8em; font-style: italic; color: #444; }
```

Create `modern.css` (Source Serif 4; crisp, tight headings):

```css
@font-face { font-family: "BodySerif"; src: url("../fonts/SourceSerif4-Regular.ttf"); font-weight: normal; font-style: normal; }
@font-face { font-family: "BodySerif"; src: url("../fonts/SourceSerif4-Italic.ttf"); font-weight: normal; font-style: italic; }
body { font-family: "BodySerif", Georgia, serif; font-size: 1em; line-height: 1.55; margin: 1.3em 1.5em; text-align: left; }
h1, h2 { font-family: "BodySerif", serif; font-weight: 600; text-align: left; margin: 2em 0 1em; page-break-before: always; letter-spacing: -0.01em; }
p { margin: 0; text-indent: 1.2em; }
p:first-of-type, h1 + p, h2 + p { text-indent: 0; }
blockquote { margin: 1em 1.6em; border-left: 2px solid #ccc; padding-left: 0.8em; }
```

Create `children.css` (Quicksand; large, airy, no indent, no drop cap):

```css
@font-face { font-family: "BodyRound"; src: url("../fonts/Quicksand-Regular.ttf"); font-weight: normal; font-style: normal; }
@font-face { font-family: "BodyRound"; src: url("../fonts/Quicksand-Bold.ttf"); font-weight: bold; font-style: normal; }
body { font-family: "BodyRound", "Comic Sans MS", sans-serif; font-size: 1.15em; line-height: 1.8; margin: 1.4em 1.5em; text-align: left; }
h1, h2 { font-family: "BodyRound", sans-serif; font-weight: bold; text-align: center; margin: 2em 0 1.2em; page-break-before: always; }
p { margin: 0 0 1em; text-indent: 0; }
blockquote { margin: 1em 1.6em; font-style: italic; }
```

- [ ] **Step 7: Run theme tests**

Run: `python -m pytest tests/test_format.py -q`
Expected: PASS (all theme tests, given fonts were vendored in Step 5).

- [ ] **Step 8: Commit**

```
git add app/services/format/models.py app/services/format/themes.py app/services/format/theme_assets app/services/format/__init__.py tests/test_format.py
git commit -m "feat(format): theme registry, four themes (CSS + vendored OFL fonts)"
```

### Task B2: Typographic cover (Pillow)

**Files:**
- Create: `app/services/format/cover.py`
- Test: `tests/test_format.py` (add cover tests)

- [ ] **Step 1: Add cover tests to `tests/test_format.py`**

```python
def test_generate_cover_returns_png_bytes():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    data = generate_cover("The Long Road Home", "Jane Writer", Theme.classic)
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(data) > 1000


def test_generate_cover_handles_long_title():
    from app.services.format.cover import generate_cover
    from app.services.format.models import Theme

    data = generate_cover("A " * 60 + "Very Long Title", "Author Name", Theme.modern)
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m pytest tests/test_format.py -k cover -q`
Expected: FAIL — `app.services.format.cover` missing.

- [ ] **Step 3: Create `app/services/format/cover.py`**

```python
"""Generate a simple, elegant typographic cover PNG when the writer supplies
none. Uses the theme's font on a themed background. No external services."""
from __future__ import annotations

import io

from PIL import Image, ImageDraw, ImageFont

from app.services.format.models import Theme
from app.services.format.themes import get_theme

_W, _H = 1600, 2400

# (background RGB, ink RGB) per theme.
_PALETTE: dict[Theme, tuple[tuple[int, int, int], tuple[int, int, int]]] = {
    Theme.classic: ((244, 240, 232), (40, 34, 28)),
    Theme.cozy: ((247, 241, 238), (60, 46, 46)),
    Theme.modern: ((250, 250, 250), (24, 24, 28)),
    Theme.children: ((255, 248, 230), (44, 62, 80)),
}


def _wrap(draw, text, font, max_width):
    words, lines, line = text.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=font) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def generate_cover(title: str, author: str, theme: Theme) -> bytes:
    spec = get_theme(theme)
    bg, ink = _PALETTE[theme]
    img = Image.new("RGB", (_W, _H), bg)
    draw = ImageDraw.Draw(img)

    font_file = str(spec.font_paths[0])
    title_font = ImageFont.truetype(font_file, 150)
    author_font = ImageFont.truetype(font_file, 70)

    margin = 180
    max_text_width = _W - 2 * margin

    # Shrink title font until it wraps to at most 5 lines.
    size = 150
    while size > 70:
        title_font = ImageFont.truetype(font_file, size)
        lines = _wrap(draw, title, title_font, max_text_width)
        if len(lines) <= 5:
            break
        size -= 10

    line_h = int(size * 1.2)
    block_h = line_h * len(lines)
    y = (_H // 2) - block_h // 2 - 120
    for line in lines:
        w = draw.textlength(line, font=title_font)
        draw.text(((_W - w) / 2, y), line, fill=ink, font=title_font)
        y += line_h

    # Divider rule + author.
    rule_y = y + 80
    draw.line([(margin + 200, rule_y), (_W - margin - 200, rule_y)], fill=ink, width=3)
    author_text = author.upper()
    aw = draw.textlength(author_text, font=author_font)
    draw.text(((_W - aw) / 2, rule_y + 60), author_text, fill=ink, font=author_font)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
```

- [ ] **Step 4: Run cover tests**

Run: `python -m pytest tests/test_format.py -k cover -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```
git add app/services/format/cover.py tests/test_format.py
git commit -m "feat(format): Pillow typographic cover generation"
```

### Task B3: Converter pipeline + EPUB validation

**Files:**
- Create: `app/services/format/converter.py`
- Test: `tests/test_format.py` (add conversion tests), `tests/conftest.py` (add sample_docx fixture)

- [ ] **Step 1: Add a `sample_docx` fixture to `tests/conftest.py`**

```python
@pytest.fixture()
def sample_docx(tmp_path):
    """A small real DOCX with a heading and paragraphs, for Format tests."""
    from docx import Document

    doc = Document()
    doc.add_heading("Chapter One", level=1)
    doc.add_paragraph("It was a bright cold day and the clocks were striking.")
    doc.add_paragraph("She walked the long road home, thinking of nothing at all.")
    doc.add_heading("Chapter Two", level=1)
    doc.add_paragraph("The second chapter opens on a quiet morning by the sea.")
    path = tmp_path / "manuscript.docx"
    doc.save(path)
    return path
```

- [ ] **Step 2: Add conversion + validation tests to `tests/test_format.py`**

```python
def test_convert_docx_produces_valid_epub(sample_docx, tmp_path):
    from app.services.format.converter import convert_to_epub
    from app.services.format.models import Theme

    out = tmp_path / "book.epub"
    convert_to_epub(
        source=sample_docx, out_path=out,
        title="My Stories", author="Jane Writer", theme=Theme.cozy,
    )
    assert out.is_file()

    import zipfile
    with zipfile.ZipFile(out) as zf:
        names = zf.namelist()
        assert "mimetype" in names
        assert zf.read("mimetype") == b"application/epub+zip"
        assert any(n.endswith("container.xml") for n in names)
        # the embedded theme font is present
        assert any("Newsreader" in n for n in names)
        # at least one chapter/content document exists
        assert any(n.endswith(".xhtml") or n.endswith(".html") for n in names)


def test_convert_txt_with_generated_cover(tmp_path):
    from app.services.format.converter import convert_to_epub
    from app.services.format.models import Theme

    src = tmp_path / "story.txt"
    src.write_text("First paragraph.\n\nSecond paragraph.\n", encoding="utf-8")
    out = tmp_path / "txt.epub"
    convert_to_epub(source=src, out_path=out, title="Plain", author="Anon", theme=Theme.modern)

    import zipfile
    with zipfile.ZipFile(out) as zf:
        # a generated cover image was embedded
        assert any("cover" in n.lower() and n.lower().endswith(".png") for n in zf.namelist())


def test_convert_rejects_unknown_extension(tmp_path):
    from app.services.format.converter import convert_to_epub, UnsupportedFormat
    from app.services.format.models import Theme

    src = tmp_path / "thing.pdf"
    src.write_bytes(b"%PDF-1.4")
    import pytest
    with pytest.raises(UnsupportedFormat):
        convert_to_epub(source=src, out_path=tmp_path / "x.epub",
                        title="X", author="Y", theme=Theme.classic)


def test_validate_epub_rejects_non_epub(tmp_path):
    from app.services.format.converter import validate_epub, EpubValidationError

    bad = tmp_path / "bad.epub"
    bad.write_bytes(b"not a zip")
    import pytest
    with pytest.raises(EpubValidationError):
        validate_epub(bad)
```

- [ ] **Step 3: Run to verify failure**

Run: `python -m pytest tests/test_format.py -k "convert or validate_epub" -q`
Expected: FAIL — `app.services.format.converter` missing.

- [ ] **Step 4: Create `app/services/format/converter.py`**

```python
"""EPUB conversion pipeline. Pandoc (bundled via pypandoc_binary) does the
heavy lifting; we add theme CSS, embedded fonts, metadata, cover, copyright
page, and a structural validity check. Temp files are always cleaned up.

DOCX is the rich path. RTF cannot be read by pandoc, so we extract its text
with striprtf and feed markdown. TXT is treated as markdown (blank lines =
paragraph breaks). Logs carry counts/theme only, never manuscript content.
"""
from __future__ import annotations

import datetime
import logging
import shutil
import tempfile
import uuid
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

import pypandoc
from striprtf.striprtf import rtf_to_text

from app.services.format.cover import generate_cover
from app.services.format.models import Theme
from app.services.format.themes import get_theme

logger = logging.getLogger("quietshelf.format")

SUPPORTED = {".docx", ".rtf", ".txt"}


class UnsupportedFormat(Exception):
    """The uploaded file is not a DOCX, RTF, or TXT."""


class EpubValidationError(Exception):
    """The produced file is not a well-formed EPUB."""


def _copyright_html(author: str, year: int) -> str:
    return (
        "<div style=\"page-break-before: always; text-align: center; "
        "margin-top: 35%;\">"
        f"<p>Copyright &#169; {year} {author}</p>"
        "<p>All rights reserved.</p>"
        "</div>"
    )


def _prepare_input(source: Path, workdir: Path) -> tuple[Path, str]:
    """Return (input_path, pandoc_format) for the source file."""
    ext = source.suffix.lower()
    if ext == ".docx":
        return source, "docx"
    if ext == ".txt":
        return source, "markdown"
    if ext == ".rtf":
        text = rtf_to_text(source.read_text(encoding="utf-8", errors="ignore"))
        md = workdir / "from_rtf.md"
        md.write_text(text, encoding="utf-8")
        return md, "markdown"
    raise UnsupportedFormat(
        f"Unsupported file type '{ext}'. Please upload a DOCX, RTF, or TXT file."
    )


def validate_epub(path: Path) -> None:
    """Structural check: valid zip, correct stored mimetype, parseable
    container.xml and OPF. (Lightweight - not full epubcheck.)"""
    if not zipfile.is_zipfile(path):
        raise EpubValidationError("Output is not a valid EPUB (not a zip archive).")
    with zipfile.ZipFile(path) as zf:
        names = zf.namelist()
        if "mimetype" not in names or zf.read("mimetype") != b"application/epub+zip":
            raise EpubValidationError("EPUB mimetype entry is missing or wrong.")
        container = "META-INF/container.xml"
        if container not in names:
            raise EpubValidationError("EPUB is missing META-INF/container.xml.")
        try:
            root = ET.fromstring(zf.read(container))
        except ET.ParseError as exc:
            raise EpubValidationError("EPUB container.xml is not valid XML.") from exc
        ns = {"c": "urn:oasis:names:tc:opendocument:xmlns:container"}
        rootfile = root.find(".//c:rootfile", ns)
        if rootfile is None:
            raise EpubValidationError("EPUB container.xml has no rootfile.")
        opf_path = rootfile.get("full-path")
        if not opf_path or opf_path not in names:
            raise EpubValidationError("EPUB OPF file is missing.")
        try:
            ET.fromstring(zf.read(opf_path))
        except ET.ParseError as exc:
            raise EpubValidationError("EPUB OPF is not valid XML.") from exc


def convert_to_epub(
    *,
    source: Path,
    out_path: Path,
    title: str,
    author: str,
    theme: Theme,
    cover_image: bytes | None = None,
) -> Path:
    """Convert a manuscript to a themed, validated EPUB at out_path."""
    if source.suffix.lower() not in SUPPORTED:
        raise UnsupportedFormat(
            f"Unsupported file type '{source.suffix}'. Upload a DOCX, RTF, or TXT file."
        )
    spec = get_theme(theme)
    year = datetime.date.today().year
    workdir = Path(tempfile.mkdtemp(prefix="quietshelf_"))
    try:
        input_path, pandoc_fmt = _prepare_input(source, workdir)

        # Cover: supplied bytes, else generated typographic PNG.
        cover_path = workdir / "cover.png"
        cover_path.write_bytes(cover_image if cover_image else generate_cover(title, author, theme))

        # Metadata YAML for pandoc.
        meta = workdir / "meta.yaml"
        safe_title = title.replace('"', "'")
        safe_author = author.replace('"', "'")
        meta.write_text(
            "---\n"
            f'title: "{safe_title}"\n'
            f'author: "{safe_author}"\n'
            "lang: en\n"
            f'identifier: "urn:uuid:{uuid.uuid4()}"\n'
            f'date: "{year}"\n'
            f'rights: "Copyright © {year} {safe_author}. All rights reserved."\n'
            "---\n",
            encoding="utf-8",
        )

        copyright_file = workdir / "copyright.html"
        copyright_file.write_text(_copyright_html(safe_author, year), encoding="utf-8")

        extra_args = [
            "--standalone",
            "--toc",
            "--toc-depth=2",
            "--split-level=1",
            f"--metadata-file={meta}",
            f"--css={spec.css_path}",
            f"--epub-cover-image={cover_path}",
            f"--include-before-body={copyright_file}",
        ]
        for font in spec.font_paths:
            extra_args.append(f"--epub-embed-font={font}")

        pypandoc.convert_file(
            str(input_path),
            to="epub",
            format=pandoc_fmt,
            outputfile=str(out_path),
            extra_args=extra_args,
        )
        validate_epub(out_path)
        logger.info(
            "format_complete theme=%s source_ext=%s size_bytes=%d",
            theme.value, source.suffix.lower(), out_path.stat().st_size,
        )
        return out_path
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
```

- [ ] **Step 5: Run conversion tests**

Run: `python -m pytest tests/test_format.py -q`
Expected: PASS. If the embedded-font assertion fails because pandoc names the font differently, inspect with `python -c "import zipfile; print(zipfile.ZipFile('OUT').namelist())"` and adjust the assertion substring — the font file IS embedded; only its in-zip name varies.

- [ ] **Step 6: Commit**

```
git add app/services/format/converter.py tests/test_format.py tests/conftest.py
git commit -m "feat(format): pandoc conversion pipeline + structural EPUB validation"
```

### Task B4: Format router

**Files:**
- Create: `app/services/format/router.py`
- Test: covered by `tests/test_format.py` endpoint tests added after main is wired (Task D2). Router unit-importable now.

- [ ] **Step 1: Create `app/services/format/router.py`**

```python
"""Format endpoints: POST /api/format (returns .epub), GET /api/format/themes."""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from starlette.background import BackgroundTask

from app import config
from app.deps import guard
from app.services.format.converter import (
    EpubValidationError,
    UnsupportedFormat,
    convert_to_epub,
)
from app.services.format.models import Theme, ThemeInfo, ThemeList
from app.services.format.themes import THEMES, get_theme

logger = logging.getLogger("quietshelf.format")

router = APIRouter(prefix="/api/format", tags=["format"])


@router.get("/themes", response_model=ThemeList)
def list_themes() -> ThemeList:
    return ThemeList(
        themes=[
            ThemeInfo(id=spec.id, display_name=spec.display_name, description=spec.description)
            for spec in THEMES.values()
        ]
    )


def _safe_stem(title: str) -> str:
    keep = "".join(c if c.isalnum() or c in " -_" else "" for c in title).strip()
    return (keep or "book").replace(" ", "_")[:60]


@router.post("")
async def format_manuscript(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    author: str = Form(...),
    theme: Theme = Form(...),
    cover_image: UploadFile | None = File(None),
    _: None = Depends(guard),
):
    get_theme(theme)  # validates enum membership

    raw = await file.read()
    max_bytes = config.max_upload_mb() * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File is larger than the {config.max_upload_mb()} MB limit.",
        )

    suffix = Path(file.filename or "upload").suffix.lower()
    workdir = Path(tempfile.mkdtemp(prefix="quietshelf_req_"))
    src = workdir / f"source{suffix}"
    src.write_bytes(raw)

    cover_bytes = await cover_image.read() if cover_image is not None else None
    out = workdir / f"{_safe_stem(title)}.epub"

    try:
        convert_to_epub(
            source=src, out_path=out, title=title, author=author,
            theme=theme, cover_image=cover_bytes,
        )
    except UnsupportedFormat as exc:
        return JSONResponse(status_code=415, content={"error": "unsupported_format", "message": str(exc)})
    except EpubValidationError:
        logger.error("epub_validation_failed theme=%s", theme.value)
        return JSONResponse(
            status_code=502,
            content={
                "error": "conversion_failed",
                "message": "We couldn't build a valid EPUB from that file. Try a DOCX export.",
            },
        )

    # Stream the file, then clean up the whole request workdir.
    return FileResponse(
        out,
        media_type="application/epub+zip",
        filename=out.name,
        background=BackgroundTask(_cleanup, workdir),
    )


def _cleanup(workdir: Path) -> None:
    import shutil
    shutil.rmtree(workdir, ignore_errors=True)
```

- [ ] **Step 2: Verify the module imports cleanly**

Run: `python -c "import app.services.format.router as r; print(r.router.routes)"`
Expected: prints the route list without error.

- [ ] **Step 3: Commit**

```
git add app/services/format/router.py
git commit -m "feat(format): /api/format and /api/format/themes router"
```

---

## Phase C — Blurb service

### Task C1: Manuscript text extraction + sampling

**Files:**
- Create: `app/services/blurb/__init__.py` (empty), `app/services/blurb/extract.py`
- Test: `tests/test_blurb.py` (begins here)

- [ ] **Step 1: Write extraction tests in `tests/test_blurb.py`**

```python
"""Blurb service tests: extraction, sampling, generation, endpoint."""
from __future__ import annotations


def test_extract_text_from_txt():
    from app.services.blurb.extract import extract_text
    data = "Hello world.\n\nSecond paragraph.".encode("utf-8")
    assert "Second paragraph" in extract_text(data, ".txt")


def test_extract_text_from_docx(sample_docx):
    from app.services.blurb.extract import extract_text
    raw = sample_docx.read_bytes()
    text = extract_text(raw, ".docx")
    assert "bright cold day" in text


def test_extract_text_rejects_unknown():
    from app.services.blurb.extract import extract_text, UnsupportedFormat
    import pytest
    with pytest.raises(UnsupportedFormat):
        extract_text(b"%PDF", ".pdf")


def test_sample_text_short_passes_through():
    from app.services.blurb.extract import sample_text
    assert sample_text("a b c") == "a b c"


def test_sample_text_long_takes_opening_and_middle():
    from app.services.blurb.extract import sample_text
    words = [f"w{i}" for i in range(10000)]
    sampled = sample_text(" ".join(words), opening_words=100, middle_words=100)
    sampled_words = sampled.split()
    assert "w0" in sampled_words          # opening included
    assert len(sampled_words) <= 220      # opening + middle + a marker, bounded
    assert "w5000" in sampled_words or "w4999" in sampled_words  # middle included
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m pytest tests/test_blurb.py -q`
Expected: FAIL — module missing.

- [ ] **Step 3: Create `app/services/blurb/extract.py`**

```python
"""Read DOCX/RTF/TXT to plain text, and sample long manuscripts to stay within
token limits. Never logs content."""
from __future__ import annotations

import io

from striprtf.striprtf import rtf_to_text


class UnsupportedFormat(Exception):
    """The uploaded file is not a DOCX, RTF, or TXT."""


def extract_text(data: bytes, ext: str) -> str:
    ext = ext.lower()
    if ext == ".txt":
        return data.decode("utf-8", errors="ignore")
    if ext == ".rtf":
        return rtf_to_text(data.decode("utf-8", errors="ignore"))
    if ext == ".docx":
        from docx import Document

        doc = Document(io.BytesIO(data))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    raise UnsupportedFormat(
        f"Unsupported file type '{ext}'. Please upload a DOCX, RTF, or TXT file."
    )


def sample_text(text: str, *, opening_words: int = 1200, middle_words: int = 800) -> str:
    """For a full manuscript, send the opening plus a middle chunk - enough for
    the model to infer voice, genre, and stakes without blowing the token budget."""
    words = text.split()
    if len(words) <= opening_words + middle_words:
        return text
    opening = words[:opening_words]
    mid_start = len(words) // 2 - middle_words // 2
    middle = words[mid_start : mid_start + middle_words]
    return " ".join(opening) + "\n\n[...]\n\n" + " ".join(middle)
```

- [ ] **Step 4: Run extraction tests**

Run: `python -m pytest tests/test_blurb.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```
git add app/services/blurb/__init__.py app/services/blurb/extract.py tests/test_blurb.py
git commit -m "feat(blurb): manuscript text extraction + representative sampling"
```

### Task C2: Blurb models + generator

**Files:**
- Create: `app/services/blurb/models.py`, `app/services/blurb/generator.py`
- Test: `tests/test_blurb.py` (add generator tests)

- [ ] **Step 1: Add generator tests to `tests/test_blurb.py`**

```python
def test_generate_blurb_happy_path(monkeypatch):
    from app.services.blurb import generator
    from app.services.blurb.models import BlurbResult, Tone, Length

    fake = BlurbResult(
        back_cover="A quiet, aching novel about coming home.",
        taglines=["Home is a country you can't return to.", "Some roads only run one way.", "She left. The town remembered."],
        short_description="A short, evocative description of the book.",
        keywords=["literary fiction", "family drama", "small town"],
    )
    captured = {}

    def fake_generate_json(system, user, model):
        captured["system"] = system
        captured["user"] = user
        return fake

    monkeypatch.setattr(generator, "generate_json", fake_generate_json)
    result = generator.generate_blurb("Some manuscript text.", tone=Tone.warm, length=Length.short)
    assert result.taglines == fake.taglines
    assert "warm" in captured["system"].lower()
    assert "Some manuscript text." in captured["user"]


def test_blurb_result_validates_three_taglines():
    from app.services.blurb.models import BlurbResult
    import pytest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        BlurbResult(back_cover="x", taglines=["one", "two"], short_description="y", keywords=["z"])
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m pytest tests/test_blurb.py -k "generate_blurb or three_taglines" -q`
Expected: FAIL — models/generator missing.

- [ ] **Step 3: Create `app/services/blurb/models.py`**

```python
"""Blurb request options and the response contract."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class Tone(str, Enum):
    literary = "literary"
    punchy = "punchy"
    warm = "warm"
    mysterious = "mysterious"


class Length(str, Enum):
    short = "short"
    medium = "medium"


class BlurbRequest(BaseModel):
    text: str | None = Field(None, description="Pasted manuscript text (or upload a file).")
    tone: Tone = Tone.literary
    length: Length = Length.medium


class BlurbResult(BaseModel):
    back_cover: str
    taglines: list[str] = Field(..., min_length=3, max_length=3)
    short_description: str
    keywords: list[str]
```

- [ ] **Step 4: Create `app/services/blurb/generator.py`**

```python
"""Blurb engine: a baked-in system prompt that infers genre/tone/audience and
writes marketing copy grounded strictly in the manuscript - never inventing
plot, spoilers, quotes, or reviews. One generate_json call."""
from __future__ import annotations

from app.providers import generate_json
from app.services.blurb.extract import sample_text
from app.services.blurb.models import BlurbResult, Length, Tone

_SYSTEM = """\
You are a book marketing copywriter. You are given an excerpt from a manuscript
(its opening and a passage from the middle). Infer the genre, tone, and intended
audience from what is actually on the page.

Write marketing copy GROUNDED ONLY in the supplied text. Do NOT invent plot
points, twists, character names, settings, spoilers, quotes, or reviews that are
not present. If the excerpt is thin, stay evocative and general rather than
fabricating specifics.

Desired tone of the copy: {tone}.
Desired length of the back-cover copy: {length} (short ~80 words, medium ~130 words).

Produce a JSON object with exactly these fields:
- "back_cover": back-cover copy (~100-150 words for medium, ~80 for short)
- "taglines": an array of exactly 3 short, punchy taglines
- "short_description": a ~50-word store-listing description
- "keywords": an array of genre/category/keyword suggestions for store listings

Respond with ONLY the JSON object. No markdown fences, no commentary.
"""


def generate_blurb(text: str, *, tone: Tone = Tone.literary, length: Length = Length.medium) -> BlurbResult:
    system = _SYSTEM.format(tone=tone.value, length=length.value)
    user = sample_text(text)
    return generate_json(system, user, BlurbResult)
```

- [ ] **Step 5: Run generator tests**

Run: `python -m pytest tests/test_blurb.py -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```
git add app/services/blurb/models.py app/services/blurb/generator.py tests/test_blurb.py
git commit -m "feat(blurb): models + grounded marketing-copy generator"
```

### Task C3: Blurb router

**Files:**
- Create: `app/services/blurb/router.py`
- Test: endpoint tests added after wiring (Task D2).

- [ ] **Step 1: Create `app/services/blurb/router.py`**

```python
"""Blurb endpoint: POST /api/blurb. Accepts pasted text or an uploaded file."""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app import config
from app.deps import guard
from app.http_errors import llm_error_to_response
from app.providers import JSONParseError, ProviderError
from app.services.blurb.extract import UnsupportedFormat, extract_text
from app.services.blurb.generator import generate_blurb
from app.services.blurb.models import BlurbResult, Length, Tone

logger = logging.getLogger("quietshelf.blurb")

router = APIRouter(prefix="/api", tags=["blurb"])


@router.post("/blurb", response_model=BlurbResult)
async def blurb(
    request: Request,
    text: str | None = Form(None),
    tone: Tone = Form(Tone.literary),
    length: Length = Form(Length.medium),
    file: UploadFile | None = File(None),
    _: None = Depends(guard),
):
    if file is not None:
        raw = await file.read()
        max_bytes = config.max_upload_mb() * 1024 * 1024
        if len(raw) > max_bytes:
            raise HTTPException(status_code=413, detail=f"File is larger than the {config.max_upload_mb()} MB limit.")
        try:
            manuscript = extract_text(raw, Path(file.filename or "upload").suffix.lower())
        except UnsupportedFormat as exc:
            return JSONResponse(status_code=415, content={"error": "unsupported_format", "message": str(exc)})
    else:
        manuscript = text or ""

    if len(manuscript.split()) < 50:
        raise HTTPException(
            status_code=422,
            detail="Need more text to work with - paste at least a few paragraphs (50+ words).",
        )

    logger.info("blurb_request words=%d tone=%s length=%s", len(manuscript.split()), tone.value, length.value)
    try:
        return generate_blurb(manuscript, tone=tone, length=length)
    except (JSONParseError, ProviderError) as exc:
        return llm_error_to_response(
            exc,
            failure_code="generation_failed",
            failure_msg="The copywriter returned an unreadable result. Try again.",
        )
```

- [ ] **Step 2: Verify import**

Run: `python -c "import app.services.blurb.router as r; print([route.path for route in r.router.routes])"`
Expected: prints `['/api/blurb']` without error.

- [ ] **Step 3: Commit**

```
git add app/services/blurb/router.py
git commit -m "feat(blurb): /api/blurb router (pasted text or file upload)"
```

---

## Phase D — Wiring (main + CLI)

### Task D1: Rewrite the FastAPI app

**Files:**
- Modify (rewrite): `app/main.py`
- Test: `tests/test_infra.py` (health, access, rate limit)

- [ ] **Step 1: Write `tests/test_infra.py`**

```python
"""App-level tests: health, access code, rate limiter, themes endpoint."""
from __future__ import annotations


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["provider"] == "gemini"
    assert set(body["services"]) == {"format", "blurb", "promote"}


def test_themes_endpoint_lists_four(client):
    response = client.get("/api/format/themes")
    assert response.status_code == 200
    themes = response.json()["themes"]
    assert len(themes) == 4
    assert {t["id"] for t in themes} == {"classic", "cozy", "modern", "children"}


def test_access_code_required_when_set(client, valid_script, monkeypatch):
    monkeypatch.setenv("ACCESS_CODE", "sekrit")
    response = client.post("/api/promote", json={"script": valid_script})
    assert response.status_code == 401


def test_access_code_accepted_when_correct(client, valid_script, valid_shot_list, monkeypatch):
    monkeypatch.setenv("ACCESS_CODE", "sekrit")
    from app.services.promote import mapper
    from app.services.promote.models import ShotList
    monkeypatch.setattr(mapper, "generate_json", lambda s, u, m: ShotList.model_validate(valid_shot_list))
    response = client.post("/api/promote", json={"script": valid_script}, headers={"X-Access-Code": "sekrit"})
    assert response.status_code == 200


def test_rate_limiter_blocks_after_limit():
    from app.ratelimit import RateLimiter
    limiter = RateLimiter(limit=3, window_seconds=3600)
    assert all(limiter.allow("1.2.3.4") for _ in range(3))
    assert not limiter.allow("1.2.3.4")
    assert limiter.allow("5.6.7.8")
    assert limiter.retry_after_seconds("1.2.3.4") > 0
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m pytest tests/test_infra.py -q`
Expected: FAIL — current `app/main.py` still imports deleted `app.mapping`/`app.models`.

- [ ] **Step 3: Rewrite `app/main.py`**

```python
"""Quiet Shelf: one FastAPI app mounting three independent services, plus a
health check and the static frontend."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app import config
from app.providers import validate_startup
from app.services.blurb.router import router as blurb_router
from app.services.format.router import router as format_router
from app.services.promote.router import router as promote_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("quietshelf.api")

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    provider = validate_startup()
    logger.info("startup provider=%s model=%s", provider.name, config.model_name())
    yield


app = FastAPI(title="Quiet Shelf", version="1.0.0", docs_url=None, redoc_url=None, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allowed_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Access-Code"],
)

app.include_router(format_router)
app.include_router(blurb_router)
app.include_router(promote_router)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "provider": config.provider_name(),
        "services": ["format", "blurb", "promote"],
    }


if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False, response_model=None)
def index() -> FileResponse | JSONResponse:
    index_file = STATIC_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return JSONResponse({"status": "ok", "message": "Quiet Shelf API. See /api/health"})
```

- [ ] **Step 4: Run the full suite**

Run: `python -m pytest -q`
Expected: PASS across `test_providers`, `test_json_engine`, `test_promote`, `test_format`, `test_blurb`, `test_infra`.

- [ ] **Step 5: Commit**

```
git add app/main.py tests/test_infra.py
git commit -m "feat: mount Format/Blurb/Promote under one app; health + static"
```

### Task D2: Add endpoint tests for Format and Blurb

**Files:**
- Test: `tests/test_format.py` (endpoint), `tests/test_blurb.py` (endpoint)

- [ ] **Step 1: Add a Format endpoint test to `tests/test_format.py`**

```python
def test_format_endpoint_returns_epub(client, sample_docx):
    with open(sample_docx, "rb") as fh:
        response = client.post(
            "/api/format",
            data={"title": "My Stories", "author": "Jane Writer", "theme": "cozy"},
            files={"file": ("manuscript.docx", fh, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/epub+zip"
    assert response.content[:2] == b"PK"  # zip magic


def test_format_endpoint_rejects_unsupported(client, tmp_path):
    bad = tmp_path / "x.pdf"
    bad.write_bytes(b"%PDF-1.4")
    with open(bad, "rb") as fh:
        response = client.post(
            "/api/format",
            data={"title": "X", "author": "Y", "theme": "classic"},
            files={"file": ("x.pdf", fh, "application/pdf")},
        )
    assert response.status_code == 415
    assert response.json()["error"] == "unsupported_format"
```

- [ ] **Step 2: Add a Blurb endpoint test to `tests/test_blurb.py`**

```python
def test_blurb_endpoint_with_pasted_text(client, monkeypatch):
    from app.services.blurb import generator
    from app.services.blurb.models import BlurbResult

    fake = BlurbResult(
        back_cover="A quiet, aching novel.",
        taglines=["One.", "Two.", "Three."],
        short_description="Short description here.",
        keywords=["literary fiction"],
    )
    monkeypatch.setattr(generator, "generate_blurb", lambda *a, **k: fake)

    response = client.post(
        "/api/blurb",
        data={"text": "word " * 80, "tone": "warm", "length": "short"},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["taglines"]) == 3
    assert body["back_cover"]


def test_blurb_endpoint_rejects_too_short(client):
    response = client.post("/api/blurb", data={"text": "too short"})
    assert response.status_code == 422
```

- [ ] **Step 3: Run the full suite**

Run: `python -m pytest -q`
Expected: PASS.

- [ ] **Step 4: Commit**

```
git add tests/test_format.py tests/test_blurb.py
git commit -m "test: Format and Blurb endpoint coverage"
```

### Task D3: Typer + Rich CLI

**Files:**
- Create: `app/cli.py`
- Delete: `qfc/__init__.py`, `qfc/__main__.py`
- Test: `tests/test_cli.py`

- [ ] **Step 1: Write `tests/test_cli.py`**

```python
"""CLI smoke tests via Typer's CliRunner. Providers/engines are mocked."""
from __future__ import annotations

from typer.testing import CliRunner

from app.cli import app

runner = CliRunner()


def test_themes_command_lists_four():
    result = runner.invoke(app, ["themes"])
    assert result.exit_code == 0
    assert "Classic Literary" in result.stdout
    assert "Children's" in result.stdout


def test_health_command(monkeypatch):
    result = runner.invoke(app, ["health"])
    assert result.exit_code == 0
    assert "gemini" in result.stdout.lower()


def test_promote_command_writes_json(tmp_path, monkeypatch, valid_shot_list):
    from app.services.promote import mapper
    from app.services.promote.models import ShotList
    monkeypatch.setattr(mapper, "generate_json", lambda s, u, m: ShotList.model_validate(valid_shot_list))

    script = tmp_path / "s.txt"
    script.write_text(("the quick brown fox jumps over the lazy dog again " * 15), encoding="utf-8")
    out = tmp_path / "shotlist.json"
    result = runner.invoke(app, ["promote", str(script), "--out", str(out)])
    assert result.exit_code == 0
    assert out.is_file()
    assert "video_title_suggestion" in out.read_text(encoding="utf-8")


def test_format_command_writes_epub(tmp_path, sample_docx):
    out = tmp_path / "book.epub"
    result = runner.invoke(
        app,
        ["format", str(sample_docx), "--title", "My Stories", "--author", "Jane", "--theme", "cozy", "--out", str(out)],
    )
    assert result.exit_code == 0
    assert out.is_file()
    assert out.read_bytes()[:2] == b"PK"
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m pytest tests/test_cli.py -q`
Expected: FAIL — `app.cli` missing.

- [ ] **Step 3: Create `app/cli.py`**

```python
"""Quiet Shelf CLI (Typer + Rich): format, blurb, promote, themes, health.

Runs the services in-process using the same provider config as the server.
"""
from __future__ import annotations

import json
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from app import config
from app.providers import (
    JSONParseError,
    ProviderConfigError,
    ProviderError,
    validate_startup,
)
from app.services.blurb.extract import extract_text
from app.services.blurb.generator import generate_blurb
from app.services.blurb.models import Length, Tone
from app.services.format.converter import UnsupportedFormat, convert_to_epub
from app.services.format.models import Theme
from app.services.format.themes import THEMES
from app.services.promote.mapper import map_script

app = typer.Typer(help="Quiet Shelf - turn a manuscript into finished, sellable things.", add_completion=False)
console = Console()
err = Console(stderr=True)


def _require_provider() -> None:
    try:
        validate_startup()
    except ProviderConfigError as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=1)


@app.command()
def themes() -> None:
    """List the available EPUB themes."""
    table = Table(title="Quiet Shelf themes")
    table.add_column("id", style="bold")
    table.add_column("name")
    table.add_column("description")
    for spec in THEMES.values():
        table.add_row(spec.id.value, spec.display_name, spec.description)
    console.print(table)


@app.command()
def health() -> None:
    """Show the configured provider and model."""
    console.print(f"provider: [bold]{config.provider_name()}[/bold]")
    console.print(f"model:    {config.model_name()}")


@app.command()
def format(
    manuscript: Path = typer.Argument(..., exists=True, readable=True),
    title: str = typer.Option(..., "--title"),
    author: str = typer.Option(..., "--author"),
    theme: Theme = typer.Option(Theme.classic, "--theme"),
    out: Path = typer.Option(None, "--out"),
) -> None:
    """Convert a manuscript (DOCX/RTF/TXT) into a themed EPUB."""
    out_path = out or manuscript.with_suffix(".epub")
    console.print(f"Formatting [bold]{manuscript.name}[/bold] with the '{theme.value}' theme...")
    try:
        convert_to_epub(source=manuscript, out_path=out_path, title=title, author=author, theme=theme)
    except UnsupportedFormat as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=1)
    console.print(f"[green]Wrote[/green] {out_path}")


@app.command()
def blurb(
    manuscript: Path = typer.Argument(..., exists=True, readable=True),
    tone: Tone = typer.Option(Tone.literary, "--tone"),
    length: Length = typer.Option(Length.medium, "--length"),
    out: Path = typer.Option(None, "--out"),
) -> None:
    """Generate back-cover copy, taglines, and keywords from a manuscript."""
    _require_provider()
    text = extract_text(manuscript.read_bytes(), manuscript.suffix.lower())
    console.print(f"Writing {tone.value} copy with {config.provider_name()}/{config.model_name()}...")
    try:
        result = generate_blurb(text, tone=tone, length=length)
    except (JSONParseError, ProviderError) as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=2)
    payload = result.model_dump()
    if out:
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        console.print(f"[green]Wrote[/green] {out}")
    else:
        console.print_json(data=payload)


@app.command()
def promote(
    script: Path = typer.Argument(..., exists=True, readable=True),
    out: Path = typer.Option(None, "--out"),
) -> None:
    """Map a script (plain text) into a stock-footage shot list."""
    _require_provider()
    text = script.read_text(encoding="utf-8")
    word_count = len(text.split())
    if word_count < config.MIN_WORDS:
        err.print(f"[red]error:[/red] script too short - needs at least {config.MIN_WORDS} words (got {word_count}).")
        raise typer.Exit(code=1)
    if word_count > config.MAX_WORDS:
        err.print(f"[red]error:[/red] script too long ({word_count} words) - split it into parts.")
        raise typer.Exit(code=1)
    out_path = out or script.with_suffix(".shotlist.json")
    console.print(f"Mapping {word_count} words with {config.provider_name()}/{config.model_name()}...")
    try:
        shot_list = map_script(text)
    except (JSONParseError, ProviderError) as exc:
        err.print(f"[red]error:[/red] {exc}")
        raise typer.Exit(code=2)
    out_path.write_text(json.dumps(shot_list.model_dump(), indent=2, ensure_ascii=False), encoding="utf-8")
    console.print(f"[green]Wrote[/green] {out_path} ({len(shot_list.segments)} segments)")


if __name__ == "__main__":
    app()
```

- [ ] **Step 4: Delete the old CLI package**

Run: `git rm -r qfc`
Expected: `qfc/__init__.py` and `qfc/__main__.py` staged for deletion.

- [ ] **Step 5: Run CLI tests + full suite**

Run: `python -m pytest -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```
git add app/cli.py tests/test_cli.py
git commit -m "feat(cli): Typer CLI (format/blurb/promote/themes/health); drop legacy qfc CLI"
```

---

## Phase E — Packaging & docs

### Task E1: Packaging, env, Docker, console script

**Files:**
- Create: `pyproject.toml`
- Modify (rewrite): `Dockerfile`, `docker-compose.yml`, `.env.example`
- Modify: `static/engine.js` (point the legacy demo at `/api/promote`)

- [ ] **Step 1: Create `pyproject.toml`** (registers the `quiet-shelf` console script)

```toml
[project]
name = "quiet-shelf"
version = "1.0.0"
description = "A writer's toolkit: manuscript in, finished sellable things out."
requires-python = ">=3.11"
dynamic = ["dependencies"]

[project.scripts]
quiet-shelf = "app.cli:app"

[tool.setuptools]
packages = ["app"]

[tool.setuptools.dynamic]
dependencies = { file = ["requirements.txt"] }

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"
```

- [ ] **Step 2: Verify the console script installs and runs**

Run: `python -m pip install -e .`
Then run: `quiet-shelf themes`
Expected: prints the four-theme table.

- [ ] **Step 3: Rewrite `.env.example`**

```
# Which free AI backend to use: gemini | groq | ollama
LLM_PROVIDER=gemini

# Free, no credit card:
GEMINI_API_KEY=          # https://aistudio.google.com
GROQ_API_KEY=            # https://console.groq.com

# Local, fully offline/open-source option:
OLLAMA_HOST=http://localhost:11434

# Optional model override (otherwise a sensible default per provider)
MODEL_NAME=

# Optional shared access code; if set, requests need an X-Access-Code header
ACCESS_CODE=

ALLOWED_ORIGINS=*
RATE_LIMIT=20/hour
MAX_UPLOAD_MB=25
```

Note: `RATE_LIMIT` is read as an integer requests-per-hour by `config.rate_limit_per_hour()`; the `/hour` suffix is documentation. (If you prefer, set `RATE_LIMIT=20`.) **Implementation note:** update `config.rate_limit_per_hour()` to tolerate a `"20/hour"` value by splitting on `/` — change its body to:

```python
def rate_limit_per_hour() -> int:
    raw = os.getenv("RATE_LIMIT", str(DEFAULT_RATE_LIMIT)).split("/")[0].strip()
    return int(raw or DEFAULT_RATE_LIMIT)
```

Apply that change to `app/config.py` now, and run `python -m pytest tests/test_infra.py -q` to confirm still green.

- [ ] **Step 4: Rewrite `Dockerfile`** (no system pandoc — pypandoc_binary bundles it; fonts are vendored in the repo)

```dockerfile
FROM python:3.12-slim

WORKDIR /srv/quiet-shelf

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ app/
COPY static/ static/
COPY pyproject.toml .

RUN useradd --create-home --shell /usr/sbin/nologin shelf
USER shelf

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

- [ ] **Step 5: Rewrite `docker-compose.yml`**

```yaml
services:
  quiet-shelf:
    build: .
    ports:
      - "8000:8000"
    environment:
      - LLM_PROVIDER=${LLM_PROVIDER:-gemini}
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
      - GROQ_API_KEY=${GROQ_API_KEY:-}
      - OLLAMA_HOST=${OLLAMA_HOST:-http://localhost:11434}
      - MODEL_NAME=${MODEL_NAME:-}
      - ACCESS_CODE=${ACCESS_CODE:-}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-*}
      - RATE_LIMIT=${RATE_LIMIT:-20/hour}
      - MAX_UPLOAD_MB=${MAX_UPLOAD_MB:-25}
    restart: unless-stopped
```

- [ ] **Step 6: Point the legacy demo frontend at the renamed endpoint**

In `static/engine.js`, replace the request path `"/api/map"` with `"/api/promote"`. (Find it with `grep -n "/api/map" static/engine.js`.) The full frontend is rebuilt in a later phase; this keeps the existing Promote demo working.

- [ ] **Step 7: Build the image to confirm it's valid**

Run: `docker build -t quiet-shelf:test .`
Expected: builds successfully through all layers.

- [ ] **Step 8: Commit**

```
git add pyproject.toml Dockerfile docker-compose.yml .env.example app/config.py static/engine.js
git commit -m "build: pyproject console script, Docker (bundled pandoc), env example"
```

### Task E2: README

**Files:**
- Modify (rewrite): `README.md`

- [ ] **Step 1: Rewrite `README.md`**

```markdown
# Quiet Shelf

Hand over the hard part. Quiet Shelf takes a writer's manuscript and quietly
returns finished, sellable, promotable things — your story, on the shelf. It's
free, open-source, and runs on free-tier or fully-local AI. No accounts, no
billing, no paid AI keys.

## Three services

- **Format** — turn a manuscript (DOCX/RTF/TXT) into a beautiful, themed EPUB.
- **Blurb** — turn a manuscript into back-cover copy, taglines, and store keywords.
- **Promote** — turn a written piece into a stock-footage shot list for a promo video.

## Run it free (Gemini)

1. `git clone` this repo.
2. Get a free Gemini API key (no card) at https://aistudio.google.com.
3. `cp .env.example .env` and paste the key into `GEMINI_API_KEY`.
4. `docker compose up --build`
5. Open http://localhost:8000

## Run it private / offline (Ollama)

Install Ollama (https://ollama.com), then:

```
ollama pull qwen2.5:latest
```

Set `LLM_PROVIDER=ollama` and `OLLAMA_HOST=http://localhost:11434` in `.env`.
Nothing leaves your machine. (Format never uses AI at all.)

## CLI

```
pip install -e .
quiet-shelf format manuscript.docx --title "My Stories" --author "Name" --theme cozy --out book.epub
quiet-shelf blurb manuscript.docx --tone warm
quiet-shelf promote script.txt --out shotlist.json
quiet-shelf themes
quiet-shelf health
```

## A note on EPUBs

EPUB is reflowable: we preserve your structure, styling, images, and embed the
theme's font, but the layout is not pixel-perfect — readers re-flow text to fit
any screen. Some e-readers override embedded fonts; we embed them anyway. Plain
TXT has no structure, so those books lean entirely on the chosen theme.

## License

MIT.
```

- [ ] **Step 2: Final full run**

Run: `python -m pytest -q`
Expected: PASS (all suites).

- [ ] **Step 3: Commit**

```
git add README.md
git commit -m "docs: Quiet Shelf README (free quickstart, three services, EPUB note)"
```

---

## Definition of Done

- [ ] `python -m pytest -q` is green: providers, json_engine, promote, format, blurb, infra, cli.
- [ ] `quiet-shelf themes` and `quiet-shelf health` work after `pip install -e .`.
- [ ] `quiet-shelf format <real.docx> --title ... --author ... --theme cozy --out book.epub` produces an EPUB that opens in a reader (the user's manual acceptance test).
- [ ] `docker build` succeeds; `docker compose up` serves http://localhost:8000 with a passing `/api/health` reporting `services: [format, blurb, promote]`.
- [ ] No service under `app/services/` imports another service. Shared code lives only in `app/providers/` and app-level infra (`config`, `deps`, `http_errors`, `ratelimit`).
- [ ] Logs never contain manuscript text or keys.
- [ ] Old flat modules (`app/providers.py`, `app/mapping.py`, `app/prompt.py`, `app/models.py`) and the `qfc/` package are gone.
```
