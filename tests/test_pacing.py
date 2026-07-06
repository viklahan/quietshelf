"""Client-side pacing tests - fake clock, no sleeping, no network."""
from __future__ import annotations

import pytest

from app import config
from app.providers import gemini as gemini_mod
from app.providers.gemini import GeminiProvider
from app.providers.pacing import SlidingWindowLimiter, acquire_slot


class FakeClock:
    def __init__(self) -> None:
        self.now = 0.0
        self.slept = 0.0

    def monotonic(self) -> float:
        return self.now

    def sleep(self, seconds: float) -> None:
        self.slept += seconds
        self.now += seconds


def _limiter(rpm: int, clock: FakeClock) -> SlidingWindowLimiter:
    return SlidingWindowLimiter(rpm, clock=clock.monotonic, sleep=clock.sleep)


def test_grants_immediately_under_the_cap():
    clock = FakeClock()
    limiter = _limiter(3, clock)
    assert [limiter.acquire() for _ in range(3)] == [0.0, 0.0, 0.0]
    assert clock.slept == 0.0


def test_blocks_until_the_window_frees():
    clock = FakeClock()
    limiter = _limiter(2, clock)
    limiter.acquire()
    clock.now = 10.0
    limiter.acquire()
    waited = limiter.acquire()  # window full: must wait out the oldest start
    assert waited == pytest.approx(50.0)  # 60s window - 10s already elapsed
    assert clock.now == pytest.approx(60.0)


def test_old_starts_age_out_without_waiting():
    clock = FakeClock()
    limiter = _limiter(2, clock)
    limiter.acquire()
    limiter.acquire()
    clock.now = 61.0  # both starts now outside the rolling window
    assert limiter.acquire() == 0.0
    assert clock.slept == 0.0


def test_rpm_zero_disables_pacing(monkeypatch):
    monkeypatch.setenv("GEMINI_RPM", "0")
    assert config.provider_rpm("gemini") == 0
    acquire_slot("gemini")  # must return instantly, creating no limiter


def test_rpm_env_override_and_defaults(monkeypatch):
    monkeypatch.setenv("GEMINI_RPM", "5")
    assert config.provider_rpm("gemini") == 5
    monkeypatch.delenv("GEMINI_RPM", raising=False)
    assert config.provider_rpm("gemini") == config.DEFAULT_PROVIDER_RPM["gemini"]
    assert config.provider_rpm("ollama") == 0  # local: never paced by default
    monkeypatch.setenv("GEMINI_RPM", "garbage")
    assert config.provider_rpm("gemini") == config.DEFAULT_PROVIDER_RPM["gemini"]


def test_gemini_generate_acquires_a_slot(monkeypatch):
    """The pacer must sit in front of the real API call."""
    order: list[str] = []
    monkeypatch.setattr(
        gemini_mod, "acquire_slot", lambda name: order.append(f"slot:{name}")
    )

    class _Models:
        def generate_content(self, **kwargs):
            order.append("api_call")
            return type("R", (), {"text": "{}"})()

    class _Client:
        def __init__(self, **kwargs) -> None:
            self.models = _Models()

    monkeypatch.setattr(gemini_mod.genai, "Client", _Client)
    GeminiProvider().generate("system mentioning JSON", "user")
    assert order == ["slot:gemini", "api_call"]
