import os
from typing import Any

import httpx
from app.core.logging import logger


class TelemetryCollector:
    _client: httpx.AsyncClient | None = None

    @classmethod
    def get_client(cls) -> httpx.AsyncClient:
        if cls._client is None or cls._client.is_closed:
            cls._client = httpx.AsyncClient()
        return cls._client

    @classmethod
    async def submit_trace(cls, payload: dict[str, Any]) -> None:
        url = os.getenv("TELEMETRY_INGEST_URL", "http://localhost:8000/api/v1/traces")
        try:
            client = cls.get_client()
            resp = await client.post(url, json=payload, timeout=5.0)
            if resp.status_code not in [200, 201]:
                logger.error(
                    "telemetry_collector_submit_failed",
                    status_code=resp.status_code,
                    response=resp.text,
                )
        except Exception as e:
            logger.error(
                "telemetry_collector_submit_exception",
                error=str(e),
            )

    @classmethod
    async def close(cls) -> None:
        if cls._client and not cls._client.is_closed:
            await cls._client.aclose()
            cls._client = None
