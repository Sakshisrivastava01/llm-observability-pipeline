from contextlib import asynccontextmanager
from typing import AsyncGenerator

import httpx
import structlog
from app.api.v1.endpoints import router as api_router
from app.core.config import settings
from app.core.middleware import CorrelationMiddleware
from app.core.rate_limiter import RateLimiterMiddleware
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

logger = structlog.get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    app.state.http_client = httpx.AsyncClient()
    yield
    await app.state.http_client.aclose()


app = FastAPI(
    title="Enterprise LLM Observability Ingest API",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
if not origins:
    origins = [
        "https://llm-observability-pipeline-ten.vercel.app",
        "https://llm-observability-pipeline.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CorrelationMiddleware)
app.add_middleware(RateLimiterMiddleware, max_requests=120)

app.include_router(api_router, prefix="/api/v1")


def get_cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin")
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    if not origins:
        origins = [
            "https://llm-observability-pipeline-ten.vercel.app",
            "https://llm-observability-pipeline.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000",
        ]
    if origin in origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> Response:
    logger.exception("Database error occurred during request", error=str(exc))
    return JSONResponse(
        status_code=400,
        content={"detail": "Database connection or integrity constraint violation."},
        headers=get_cors_headers(request),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> Response:
    logger.exception("Generic server error occurred during request", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
        headers=get_cors_headers(request),
    )


@app.get("/health")
async def health_status() -> dict[str, str]:
    return {"status": "healthy"}
