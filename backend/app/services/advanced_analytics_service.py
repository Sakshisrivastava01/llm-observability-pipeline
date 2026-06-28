import math
from datetime import timedelta
from typing import Any

from app.models.span import Span
from app.models.trace import Trace
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class AdvancedAnalyticsService:
    """Computes duration percentiles, rolling averages, outliers, and forecasting predictions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_percentiles(self) -> dict[str, float]:
        """Calculates P50, P90, P95, and P99 latency percentiles of ingested transactions."""
        stmt = select(Trace)
        result = await self.db.execute(stmt)
        traces = result.scalars().all()
        if not traces:
            return {"P50": 0.0, "P90": 0.0, "P95": 0.0, "P99": 0.0}

        latencies = sorted(
            [(t.end_time - t.start_time).total_seconds() for t in traces]
        )
        n = len(latencies)

        def _pct(p: float) -> float:
            idx = max(0, min(n - 1, int(n * p)))
            return latencies[idx]

        return {
            "P50": _pct(0.50),
            "P90": _pct(0.90),
            "P95": _pct(0.95),
            "P99": _pct(0.99),
        }

    async def get_throughput_trends(
        self, interval: str = "daily"
    ) -> list[dict[str, Any]]:
        """Calculates daily, weekly, or monthly query volumes."""
        stmt = select(Trace).order_by(Trace.start_time.asc())
        result = await self.db.execute(stmt)
        traces = result.scalars().all()
        if not traces:
            return []

        counts: dict[str, int] = {}
        for t in traces:
            dt = t.start_time
            if interval == "hourly":
                key = dt.strftime("%Y-%m-%d %H:00")
            elif interval == "weekly":
                monday = dt - timedelta(days=dt.weekday())
                key = monday.strftime("%Y-%m-%d")
            elif interval == "monthly":
                key = dt.strftime("%Y-%m")
            else:
                key = dt.strftime("%Y-%m-%d")
            counts[key] = counts.get(key, 0) + 1

        return [{"timestamp": k, "requests": v} for k, v in sorted(counts.items())]

    async def get_rolling_averages(self, window: int = 5) -> list[dict[str, Any]]:
        """Calculates a moving average sequence of request durations."""
        stmt = select(Trace).order_by(Trace.start_time.asc())
        result = await self.db.execute(stmt)
        traces = result.scalars().all()
        if not traces:
            return []

        data = []
        latencies = []
        for t in traces:
            lat = (t.end_time - t.start_time).total_seconds()
            latencies.append(lat)
            curr_window = latencies[-window:]
            avg_lat = sum(curr_window) / len(curr_window)
            data.append(
                {
                    "trace_id": t.trace_id,
                    "timestamp": t.start_time.isoformat(),
                    "latency": lat,
                    "rolling_avg": avg_lat,
                }
            )
        return data

    async def detect_anomalies(self) -> list[dict[str, Any]]:
        """Flags transaction outliers exceeding a 2x standard deviation threshold boundary."""
        stmt = select(Trace)
        result = await self.db.execute(stmt)
        traces = result.scalars().all()
        if not traces or len(traces) < 5:
            return []

        latencies = [(t.end_time - t.start_time).total_seconds() for t in traces]
        mean = sum(latencies) / len(latencies)
        variance = sum((x - mean) ** 2 for x in latencies) / len(latencies)
        std_dev = math.sqrt(variance)

        anomalies = []
        for t in traces:
            lat = (t.end_time - t.start_time).total_seconds()
            if std_dev > 0 and lat > (mean + 2.0 * std_dev):
                anomalies.append(
                    {
                        "trace_id": t.trace_id,
                        "name": t.name,
                        "latency": lat,
                        "mean": mean,
                        "std_dev": std_dev,
                        "timestamp": t.start_time.isoformat(),
                    }
                )
        return anomalies

    async def predict_metrics(self) -> dict[str, float]:
        """Predicts tomorrow's latency, token budget, and success rates via regression trends."""
        stmt = select(Trace).order_by(Trace.start_time.asc())
        result = await self.db.execute(stmt)
        traces = result.scalars().all()
        if not traces:
            return {
                "predicted_latency": 0.0,
                "predicted_cost": 0.0,
                "predicted_success_rate": 100.0,
            }

        span_stmt = select(Span)
        span_result = await self.db.execute(span_stmt)
        spans = span_result.scalars().all()

        latencies = [(t.end_time - t.start_time).total_seconds() for t in traces]
        n = len(traces)

        if n >= 2:
            x = list(range(n))
            y = latencies
            x_mean = sum(x) / n
            y_mean = sum(y) / n
            num = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
            den = sum((x[i] - x_mean) ** 2 for i in range(n))
            m = num / den if den != 0 else 0.0
            c = y_mean - m * x_mean
            next_latency = max(0.0, m * n + c)
        else:
            next_latency = latencies[0] if latencies else 0.0

        avg_cost = sum(s.cost for s in spans) / n if n else 0.0
        errors = sum(1 for s in spans if s.error is not None)
        success_rate = ((n - errors) / n) * 100.0 if n else 100.0

        return {
            "predicted_latency": float(next_latency),
            "predicted_cost": float(avg_cost * 1.05),
            "predicted_success_rate": float(max(0.0, min(100.0, success_rate))),
        }

    async def get_provider_comparison(self) -> dict[str, Any]:
        """Provides rank models comparing costs, speed, and reliability across OpenAI and Ollama."""
        stmt = select(Span).where(Span.span_type == "llm")
        result = await self.db.execute(stmt)
        spans = result.scalars().all()

        providers: dict[str, dict[str, Any]] = {}
        for s in spans:
            model = s.model_name or "unknown"
            prov = "openai" if ("gpt" in model or "text-" in model) else "ollama"

            p_data = providers.setdefault(
                prov,
                {
                    "avg_latency": [],
                    "total_cost": 0.0,
                    "total_tokens": 0,
                    "failures": 0,
                    "total": 0,
                },
            )

            p_data["avg_latency"].append((s.end_time - s.start_time).total_seconds())
            p_data["total_cost"] += float(s.cost)
            p_data["total_tokens"] += s.total_tokens
            if s.error:
                p_data["failures"] += 1
            p_data["total"] += 1

        res = {}
        for name, data in providers.items():
            tot = data["total"]
            lats = data["avg_latency"]
            res[name] = {
                "avg_latency": sum(lats) / len(lats) if lats else 0.0,
                "avg_cost": data["total_cost"] / tot if tot else 0.0,
                "avg_tokens": data["total_tokens"] / tot if tot else 0.0,
                "failure_rate": (data["failures"] / tot) * 100.0 if tot else 0.0,
                "requests": tot,
            }
        return res
