"""Client-side request pacing for free-tier providers.

Free tiers meter REQUESTS PER MINUTE, not work per request. Promote's
chunk-parallel mapping fires up to 15 requests in a burst - against Gemini's
~10 RPM free quota that means most chunks 429 and the writer sees "the free
AI tier needs a breather" for work we chose to send too fast. The honest fix
is to pace ourselves: block each provider call until a request slot is free
inside the rolling window, so requests queue instead of failing.

Pacing is a property of the upstream quota, so it lives here in the provider
layer - services above stay oblivious. Limits come from config
(<PROVIDER>_RPM env; 0 disables). Providers are constructed per call, so
limiters are module-level singletons shared across threads.
"""
from __future__ import annotations

import logging
import threading
import time
from collections import deque

from app import config

logger = logging.getLogger("quietshelf.pacing")

WINDOW_SECONDS = 60.0


class SlidingWindowLimiter:
    """Thread-safe: at most `rpm` acquisitions per rolling window."""

    def __init__(
        self,
        rpm: int,
        window_seconds: float = WINDOW_SECONDS,
        clock=time.monotonic,
        sleep=time.sleep,
    ) -> None:
        self.rpm = rpm
        self._window = window_seconds
        self._clock = clock
        self._sleep = sleep
        self._starts: deque[float] = deque()
        self._lock = threading.Lock()

    def acquire(self) -> float:
        """Block until a request slot is free; returns seconds waited."""
        waited = 0.0
        while True:
            with self._lock:
                now = self._clock()
                while self._starts and now - self._starts[0] >= self._window:
                    self._starts.popleft()
                if len(self._starts) < self.rpm:
                    self._starts.append(now)
                    return waited
                wait_for = self._window - (now - self._starts[0])
            wait_for = max(wait_for, 0.05)
            self._sleep(wait_for)
            waited += wait_for


# Keyed by (provider, rpm) so an env change mid-process gets a fresh limiter
# instead of a stale quota.
_limiters: dict[tuple[str, int], SlidingWindowLimiter] = {}
_limiters_lock = threading.Lock()


def acquire_slot(provider_name: str) -> None:
    """Pace one upstream request for `provider_name`. No-op when its RPM is 0."""
    rpm = config.provider_rpm(provider_name)
    if rpm <= 0:
        return
    key = (provider_name, rpm)
    with _limiters_lock:
        limiter = _limiters.get(key)
        if limiter is None:
            limiter = _limiters[key] = SlidingWindowLimiter(rpm)
    waited = limiter.acquire()
    if waited > 0.5:
        logger.info(
            "paced provider=%s rpm=%d waited_ms=%d",
            provider_name,
            rpm,
            int(waited * 1000),
        )
