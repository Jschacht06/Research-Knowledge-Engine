from collections import defaultdict, deque
from datetime import datetime, timedelta, UTC
from threading import Lock

from fastapi import HTTPException, status


def utc_now() -> datetime:
    return datetime.now(UTC)


class FailedAttemptLimiter:
    def __init__(self, *, max_attempts: int, window_minutes: int, lockout_minutes: int):
        self.max_attempts = max_attempts
        self.window = timedelta(minutes=window_minutes)
        self.lockout = timedelta(minutes=lockout_minutes)
        self._attempts: dict[str, deque[datetime]] = defaultdict(deque)
        self._locked_until: dict[str, datetime] = {}
        self._lock = Lock()

    def _prune(self, key: str, now: datetime) -> None:
        attempts = self._attempts[key]
        cutoff = now - self.window
        while attempts and attempts[0] < cutoff:
            attempts.popleft()
        locked_until = self._locked_until.get(key)
        if locked_until and locked_until <= now:
            self._locked_until.pop(key, None)

    def ensure_allowed(self, key: str, message: str) -> None:
        now = utc_now()
        with self._lock:
            self._prune(key, now)
            locked_until = self._locked_until.get(key)
            if locked_until and locked_until > now:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message)

    def record_failure(self, key: str) -> None:
        now = utc_now()
        with self._lock:
            self._prune(key, now)
            attempts = self._attempts[key]
            attempts.append(now)
            if len(attempts) >= self.max_attempts:
                self._locked_until[key] = now + self.lockout
                attempts.clear()

    def record_success(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)
            self._locked_until.pop(key, None)


class SlidingWindowLimiter:
    def __init__(self, *, max_requests: int, window_minutes: int):
        self.max_requests = max_requests
        self.window = timedelta(minutes=window_minutes)
        self._requests: dict[str, deque[datetime]] = defaultdict(deque)
        self._lock = Lock()

    def _prune(self, key: str, now: datetime) -> None:
        requests = self._requests[key]
        cutoff = now - self.window
        while requests and requests[0] < cutoff:
            requests.popleft()
        if not requests:
            self._requests.pop(key, None)

    def check(self, key: str, message: str) -> None:
        now = utc_now()
        with self._lock:
            queue = self._requests[key]
            self._prune(key, now)
            queue = self._requests[key]
            if len(queue) >= self.max_requests:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message)
            queue.append(now)


login_failures_by_ip = FailedAttemptLimiter(
    max_attempts=10,
    window_minutes=10,
    lockout_minutes=10,
)
login_failures_by_email = FailedAttemptLimiter(
    max_attempts=10,
    window_minutes=10,
    lockout_minutes=10,
)
register_rate_limiter = SlidingWindowLimiter(max_requests=5, window_minutes=10)
upload_rate_limiter = SlidingWindowLimiter(max_requests=10, window_minutes=10)
chat_rate_limiter = SlidingWindowLimiter(max_requests=30, window_minutes=10)
