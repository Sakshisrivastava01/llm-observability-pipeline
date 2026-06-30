import asyncio

import pytest
from app.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenError
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.services.advanced_analytics_service import AdvancedAnalyticsService
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient


@pytest.mark.anyio
async def test_circuit_breaker_states() -> None:
    """Verifies circuit breaker trips to OPEN after threshold failures and fails requests."""
    breaker = CircuitBreaker(failure_threshold=2, recovery_timeout=0.1)

    async def _failing_call() -> None:
        raise ValueError("Simulated network failure")

    # 1. First failure
    with pytest.raises(ValueError):
        await breaker.call(_failing_call)
    assert breaker.state == "closed"

    # 2. Second failure - should trip circuit
    with pytest.raises(ValueError):
        await breaker.call(_failing_call)
    assert breaker.state == "open"

    # 3. Request in open state should fail immediately
    with pytest.raises(CircuitBreakerOpenError):
        await breaker.call(_failing_call)

    # 4. Cooldown recovery timeout
    await asyncio.sleep(0.12)
    breaker.check_state()
    assert breaker.state == "half-open"


@pytest.mark.anyio
async def test_rate_limiter_middleware() -> None:
    """Verifies that the rate limiter middleware returns 429 Too Many Requests after limits are reached."""
    app = FastAPI()
    app.add_middleware(RateLimiterMiddleware, max_requests=2, window_seconds=5.0)

    @app.get("/test-route")
    async def test_route() -> dict[str, str]:
        return {"status": "success"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # First request
        r1 = await client.get("/test-route")
        assert r1.status_code == 200

        # Second request
        r2 = await client.get("/test-route")
        assert r2.status_code == 200

        # Third request - rate limited
        r3 = await client.get("/test-route")
        assert r3.status_code == 429
        assert "Rate limit exceeded" in r3.json()["detail"]


@pytest.mark.anyio
async def test_advanced_analytics_calculations(db_session) -> None:
    """Verifies advanced analytics indicators (percentiles, predictions)."""
    service = AdvancedAnalyticsService(db_session)

    # Empty DB state
    percentiles = await service.get_percentiles()
    assert percentiles["P50"] == 0.0

    predictions = await service.predict_metrics()
    assert predictions["predicted_latency"] == 0.0
