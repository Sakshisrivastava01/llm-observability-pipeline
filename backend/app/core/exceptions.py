class ObservabilityError(Exception):
    pass


class CircuitBreakerOpenError(ObservabilityError):
    pass


class RateLimitExceededError(ObservabilityError):
    pass
