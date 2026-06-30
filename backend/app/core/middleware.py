import uuid

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = structlog.get_logger("app")


class CorrelationMiddleware(BaseHTTPMiddleware):
    """FastAPI Middleware to trace and correlate requests using Correlation-IDs."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Resolve request and correlation identifiers
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))

        # Bind to structlog thread-local context variables
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            correlation_id=correlation_id,
        )

        request.state.request_id = request_id
        request.state.correlation_id = correlation_id

        # Execute endpoints execution stack
        response = await call_next(request)

        # Expose tracing parameters in headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = correlation_id

        return response
