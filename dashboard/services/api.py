from typing import Any

import httpx


class APIService:
    """HTTP client service querying FastAPI telemetry and analytics endpoints."""

    def __init__(self, base_url: str | None = None):
        import os

        self.base_url = base_url or os.getenv(
            "BACKEND_API_URL", "http://localhost:8000/api/v1"
        )

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

    def acknowledge_alert(self, alert_id: str) -> dict[str, Any]:
        """Acknowledges a triggered threshold alert."""
        try:
            resp = httpx.post(
                f"{self.base_url}/alerts/{alert_id}/acknowledge", timeout=5.0
            )
            return resp.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def upsert_pricing(
        self,
        provider: str,
        model_name: str,
        input_price: float,
        output_price: float,
    ) -> dict[str, Any]:
        """Registers or updates model pricing config."""
        try:
            payload = {
                "provider": provider,
                "model_name": model_name,
                "input_token_price_per_1k": input_price,
                "output_token_price_per_1k": output_price,
            }
            resp = httpx.post(f"{self.base_url}/pricing", json=payload, timeout=5.0)
            return resp.json()
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_pricing(self) -> list[dict[str, Any]]:
        """Queries all registered pricing configs."""
        try:
            resp = httpx.get(f"{self.base_url}/pricing", timeout=5.0)
            return resp.json()
        except Exception:
            return []

    def get_advanced_analytics(self) -> dict[str, Any]:
        """Queries advanced analytics percentiles, anomalies, and forecasts."""
        try:
            resp = httpx.get(f"{self.base_url}/analytics/advanced", timeout=5.0)
            return resp.json()
        except Exception:
            return {
                "percentiles": {"P50": 0.0, "P90": 0.0, "P95": 0.0, "P99": 0.0},
                "anomalies": [],
                "predictions": {
                    "predicted_latency": 0.0,
                    "predicted_cost": 0.0,
                    "predicted_success_rate": 100.0,
                },
            }

    def get_analytics_summaries(self, interval: str = "daily") -> dict[str, Any]:
        """Queries throughput trends and rolling averages."""
        try:
            resp = httpx.get(
                f"{self.base_url}/analytics/summaries?interval={interval}",
                timeout=5.0,
            )
            return resp.json()
        except Exception:
            return {"throughput_trends": [], "rolling_averages": []}

    def get_provider_comparison(self) -> dict[str, Any]:
        """Queries provider statistics comparisons."""
        try:
            resp = httpx.get(f"{self.base_url}/analytics/providers", timeout=5.0)
            return resp.json()
        except Exception:
            return {}

    def get_health_diagnostics(self) -> dict[str, Any]:
        """Queries connection health details for settings status audits."""
        try:
            resp = httpx.get(f"{self.base_url}/health/diagnostics", timeout=5.0)
            return resp.json()
        except Exception:
            return {
                "database": "offline",
                "openai": "offline",
                "ollama": "offline",
                "environment": "unknown",
            }
