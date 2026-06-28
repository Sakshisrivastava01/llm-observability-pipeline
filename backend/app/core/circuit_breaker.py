import time
from collections.abc import Callable
from typing import Any, TypeVar

T = TypeVar("T")


class CircuitBreakerOpenError(Exception):
    """Exception raised when execution is blocked due to an open circuit breaker."""

    pass


class CircuitBreaker:
    """Generic circuit breaker tracking operational failures to prevent cascading errors."""

    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "closed"  # "closed", "open", "half-open"
        self.failure_count = 0
        self.last_failure_time = 0.0

    def record_success(self) -> None:
        """Resets failure counts and closes the circuit on successful completion."""
        self.state = "closed"
        self.failure_count = 0

    def record_failure(self) -> None:
        """Tracks consecutive failures, tripping the circuit if threshold is reached."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "open"

    def check_state(self) -> None:
        """Inspects state, shifting to half-open if cooldown timeout is passed."""
        if self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half-open"
            else:
                raise CircuitBreakerOpenError(
                    "Circuit breaker is OPEN. Calls blocked to prevent failure."
                )

        # In half-open state, we allow trial call. If it fails, state returns to open.

    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """Wraps any async invocation with circuit breaker lifecycle tracking."""
        self.check_state()
        try:
            res = await func(*args, **kwargs)
            self.record_success()
            return res
        except Exception as e:
            self.record_failure()
            raise e


class CircuitBreakerRegistry:
    """Singleton registry holding separate circuit breakers per external endpoint/provider."""

    _breakers: dict[str, CircuitBreaker] = {}

    @classmethod
    def get_breaker(cls, name: str) -> CircuitBreaker:
        """Retrieves or registers a new circuit breaker instance for a given key."""
        key = name.lower().strip()
        if key not in cls._breakers:
            cls._breakers[key] = CircuitBreaker()
        return cls._breakers[key]
