import asyncio

import pytest
from app.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenError
from app.core.rate_limiter import RateLimiterMiddleware
from app.services.advanced_analytics_service import AdvancedAnalyticsService
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient


@pytest.mark.anyio
async def test_circuit_breaker_states() -> None:
    breaker = CircuitBreaker(failure_threshold=2, recovery_timeout=0.1)

    async def _failing_call() -> None:
        raise ValueError("Simulated network failure")

    with pytest.raises(ValueError):
        await breaker.call(_failing_call)
    assert breaker.state == "closed"

    with pytest.raises(ValueError):
        await breaker.call(_failing_call)
    assert breaker.state == "open"

    with pytest.raises(CircuitBreakerOpenError):
        await breaker.call(_failing_call)

    await asyncio.sleep(0.12)
    breaker.check_state()
    assert breaker.state == "half-open"


@pytest.mark.anyio
async def test_rate_limiter_middleware() -> None:
    app = FastAPI()
    app.add_middleware(RateLimiterMiddleware, max_requests=2, window_seconds=5.0)

    @app.get("/test-route")
    async def test_route() -> dict[str, str]:
        return {"status": "success"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        r1 = await client.get("/test-route")
        assert r1.status_code == 200

        r2 = await client.get("/test-route")
        assert r2.status_code == 200

        r3 = await client.get("/test-route")
        assert r3.status_code == 429
        assert "Rate limit exceeded" in r3.json()["detail"]


@pytest.mark.anyio
async def test_advanced_analytics_calculations(db_session) -> None:
    service = AdvancedAnalyticsService(db_session)

    percentiles = await service.get_percentiles()
    assert percentiles["P50"] == 0.0

    predictions = await service.predict_metrics()
    assert predictions["predicted_latency"] == 0.0
