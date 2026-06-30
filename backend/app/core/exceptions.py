class ObservabilityError(Exception):
    """Base exception class for all LLM Observability Pipeline exceptions."""

    pass


class CircuitBreakerOpenError(ObservabilityError):
    """Raised when a circuit breaker is open and blocking requests."""

    pass


class RateLimitExceededError(ObservabilityError):
    """Raised when a rate limit is exceeded."""

    pass
