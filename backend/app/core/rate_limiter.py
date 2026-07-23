import threading
import time
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Any, max_requests: int = 120, window_seconds: float = 60.0):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = {}
        self.lock = threading.Lock()

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if request.url.path == "/health" or request.url.path == "/api/v1/health":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Dedicated strict limits for OTP routes
        limit_key = client_ip
        max_reqs = self.max_requests
        window = self.window_seconds
        error_msg = "Rate limit exceeded. Maximum 120 requests/min."

        if request.url.path in [
            "/api/v1/auth/forgot-password",
            "/auth/forgot-password",
        ]:
            limit_key = f"{client_ip}:otp_gen"
            max_reqs = 5
            window = 60.0
            error_msg = (
                "Too many OTP generation attempts. Please try again in a minute."
            )
        elif request.url.path in [
            "/api/v1/auth/reset-password",
            "/auth/reset-password",
        ]:
            limit_key = f"{client_ip}:otp_verify"
            max_reqs = 5
            window = 60.0
            error_msg = (
                "Too many OTP verification attempts. Please try again in a minute."
            )

        if len(self.requests) > 5000:
            with self.lock:
                self.requests = {
                    key: hist
                    for key, hist in self.requests.items()
                    if any(now - t < window for t in hist)
                }

        with self.lock:
            history = self.requests.get(limit_key, [])
            history = [t for t in history if now - t < window]

            if len(history) >= max_reqs:
                return Response(
                    content=f'{{"detail": "{error_msg}"}}',
                    status_code=429,
                    media_type="application/json",
                )

            history.append(now)
            self.requests[limit_key] = history

        return await call_next(request)
