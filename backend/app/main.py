from contextlib import asynccontextmanager
from typing import AsyncGenerator

import httpx
from app.api.v1.endpoints import router as api_router
from app.middleware.middleware import CorrelationMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


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
    allow_origins=[
        "https://llm-observability-pipeline.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CorrelationMiddleware)
app.add_middleware(RateLimiterMiddleware, max_requests=120)

app.include_router(api_router, prefix="/api/v1")


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> Response:
    """Catches database-related exceptions globally, returning 400 Bad Request."""
    return JSONResponse(
        status_code=400,
        content={"detail": f"Database integrity error: {str(exc)}"},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> Response:
    """Catches all unhandled generic exceptions, returning 500 Internal Server Error."""
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.get("/health")
async def health_status() -> dict[str, str]:
    """Top-level health check endpoint."""
    return {"status": "healthy"}
