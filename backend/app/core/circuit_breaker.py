import time
from collections.abc import Callable
from typing import Any, TypeVar

from app.core.exceptions import CircuitBreakerOpenError

T = TypeVar("T")


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "closed"
        self.failure_count = 0
        self.last_failure_time = 0.0

    def record_success(self) -> None:
        self.state = "closed"
        self.failure_count = 0

    def record_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "open"

    def check_state(self) -> None:
        if self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half-open"
            else:
                raise CircuitBreakerOpenError(
                    "Circuit breaker is OPEN. Calls blocked to prevent failure."
                )

    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        self.check_state()
        try:
            res = await func(*args, **kwargs)
            self.record_success()
            return res
        except Exception as e:
            self.record_failure()
            raise e


class CircuitBreakerRegistry:
    _breakers: dict[str, CircuitBreaker] = {}

    @classmethod
    def get_breaker(cls, name: str) -> CircuitBreaker:
        key = name.lower().strip()
        if key not in cls._breakers:
            cls._breakers[key] = CircuitBreaker()
        return cls._breakers[key]
