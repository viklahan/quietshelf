"""Tiny in-memory, per-IP sliding-window rate limiter.

Good enough for a single-container deployment; protects the hosted instance's
API bill. No external dependencies, no persistence.
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float = 3600.0) -> None:
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            return True

    def retry_after_seconds(self, key: str) -> int:
        with self._lock:
            hits = self._hits.get(key)
            if not hits:
                return 0
            return max(0, int(self.window - (time.monotonic() - hits[0])) + 1)
