from contextlib import asynccontextmanager
from typing import AsyncGenerator

import httpx
from app.api.v1.endpoints import router as api_router
from app.core.middleware import CorrelationMiddleware
from app.core.rate_limiter import RateLimiterMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Establishes connection pool client lifespans to prevent socket leaks."""
    app.state.http_client = httpx.AsyncClient()
    yield
    await app.state.http_client.aclose()


app = FastAPI(
    title="Enterprise LLM Observability Ingest API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CorrelationMiddleware)
app.add_middleware(RateLimiterMiddleware, max_requests=120)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_status() -> dict[str, str]:
    """Top-level health check endpoint."""
    return {"status": "healthy"}
