from typing import Any

import httpx


class APIService:
    """HTTP client service querying FastAPI telemetry and analytics endpoints."""

    def __init__(self, base_url: str = "http://localhost:8000/api/v1"):
        self.base_url = base_url

    def get_health(self) -> dict[str, str]:
        """Queries health status."""
        try:
            resp = httpx.get(f"{self.base_url}/health", timeout=3.0)
            return resp.json()
        except Exception:
            return {"status": "offline"}

    def get_kpis(self) -> dict[str, float]:
        """Queries aggregate metrics KPIs."""
        try:
            resp = httpx.get(f"{self.base_url}/analytics/kpis", timeout=5.0)
            return resp.json()
        except Exception:
            return {
                "total_requests": 0.0,
                "avg_latency": 0.0,
                "total_tokens": 0.0,
                "total_cost": 0.0,
                "success_rate": 100.0,
            }

    def get_model_shares(self) -> dict[str, int]:
        """Queries query distribution across models."""
        try:
            resp = httpx.get(f"{self.base_url}/analytics/models", timeout=5.0)
            return resp.json()
        except Exception:
            return {}

    def get_regressions(self) -> dict[str, bool]:
        """Queries latency regression status flags."""
        try:
            resp = httpx.get(f"{self.base_url}/analytics/regressions", timeout=5.0)
            return resp.json()
        except Exception:
            return {"regression_detected": False}

    def get_traces(self) -> list[dict[str, Any]]:
        """Queries all ingested traces."""
        try:
            resp = httpx.get(f"{self.base_url}/traces", timeout=5.0)
            return resp.json()
        except Exception:
            return []

    def get_trace(self, trace_id: str) -> dict[str, Any]:
        """Queries a single trace detail hierarchy."""
        try:
            resp = httpx.get(f"{self.base_url}/traces/{trace_id}", timeout=5.0)
            return resp.json()
        except Exception:
            return {}

    def get_evaluations(self) -> list[dict[str, Any]]:
        """Queries logged evaluations list."""
        try:
            resp = httpx.get(f"{self.base_url}/evaluations", timeout=5.0)
            return resp.json()
        except Exception:
            return []

    def run_evaluation(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Triggers evaluation scorer run on completions output."""
        try:
            resp = httpx.post(
                f"{self.base_url}/evaluations/run", json=payload, timeout=10.0
            )
            return resp.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def run_inference(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Proxies inference execution query through the backend API."""
        try:
            resp = httpx.post(f"{self.base_url}/inference", json=payload, timeout=30.0)
            return resp.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_alerts(self) -> list[dict[str, Any]]:
        """Queries logged operational alerts."""
        try:
            resp = httpx.get(f"{self.base_url}/alerts", timeout=5.0)
            return resp.json()
        except Exception:
            return []
