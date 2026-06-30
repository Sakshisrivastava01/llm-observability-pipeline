import threading
import time
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """ASGI middleware implementing token/sliding-window rate limiting per client IP."""

    def __init__(self, app: Any, max_requests: int = 120, window_seconds: float = 60.0):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = {}
        self.lock = threading.Lock()

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Bypass health indicators
        if request.url.path == "/health" or request.url.path == "/api/v1/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Prune request histories for inactive client IPs periodically if dictionary grows too large
        if len(self.requests) > 5000:
            with self.lock:
                self.requests = {
                    ip: hist
                    for ip, hist in self.requests.items()
                    if any(now - t < self.window_seconds for t in hist)
                }

        with self.lock:
            history = self.requests.get(client_ip, [])
            # Clean outdated timestamps
            history = [t for t in history if now - t < self.window_seconds]

            if len(history) >= self.max_requests:
                return Response(
                    content='{"detail": "Rate limit exceeded. Maximum 120 requests/min."}',
                    status_code=429,
                    media_type="application/json",
                )

            history.append(now)
            self.requests[client_ip] = history

        return await call_next(request)
