import math
from typing import Any

from app.models.span import Span
from app.models.trace import Trace
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


class AdvancedAnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_percentiles(self) -> dict[str, float]:
        stmt = (
            select(Trace.start_time, Trace.end_time)
            .order_by(Trace.start_time.desc())
            .limit(10000)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        if not rows:
            return {"P50": 0.0, "P90": 0.0, "P95": 0.0, "P99": 0.0}

        latencies: list[float] = sorted(
            [float((row[1] - row[0]).total_seconds()) for row in rows]
        )
        n = len(latencies)

        def _pct(p: float) -> float:
            idx = max(0, min(n - 1, int(n * p)))
            return float(latencies[idx])

        return {
            "P50": _pct(0.50),
            "P90": _pct(0.90),
            "P95": _pct(0.95),
            "P99": _pct(0.99),
        }

    async def get_throughput_trends(
        self, interval: str = "daily"
    ) -> list[dict[str, Any]]:
        stmt = (
            select(
                func.date(Trace.start_time).label("day"),
                func.count(Trace.id).label("requests"),
            )
            .group_by(func.date(Trace.start_time))
            .order_by(func.date(Trace.start_time).asc())
            .limit(90)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        if not rows:
            return []

        return [{"timestamp": str(row[0]), "requests": int(row[1])} for row in rows]

    async def get_rolling_averages(self, window: int = 5) -> list[dict[str, Any]]:
        stmt = (
            select(Trace.trace_id, Trace.start_time, Trace.end_time)
            .order_by(Trace.start_time.desc())
            .limit(1000)
        )
        result = await self.db.execute(stmt)
        rows = list(reversed(result.all()))
        if not rows:
            return []

        data = []
        latencies = []
        for row in rows:
            lat = (row[2] - row[1]).total_seconds()
            latencies.append(lat)
            curr_window = latencies[-window:]
            avg_lat = sum(curr_window) / len(curr_window)
            data.append(
                {
                    "trace_id": row[0],
                    "timestamp": row[1].isoformat(),
                    "latency": lat,
                    "rolling_avg": avg_lat,
                }
            )
        return data

    async def detect_anomalies(self) -> list[dict[str, Any]]:
        stmt = (
            select(Trace.trace_id, Trace.name, Trace.start_time, Trace.end_time)
            .order_by(Trace.start_time.desc())
            .limit(1000)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        if not rows or len(rows) < 5:
            return []

        latencies = [(row[3] - row[2]).total_seconds() for row in rows]
        mean = sum(latencies) / len(latencies)
        variance = sum((x - mean) ** 2 for x in latencies) / len(latencies)
        std_dev = math.sqrt(variance)

        anomalies = []
        for row in rows:
            lat = (row[3] - row[2]).total_seconds()
            if std_dev > 0 and lat > (mean + 2.0 * std_dev):
                anomalies.append(
                    {
                        "trace_id": row[0],
                        "name": row[1],
                        "latency": lat,
                        "mean": mean,
                        "std_dev": std_dev,
                        "timestamp": row[2].isoformat(),
                    }
                )
        return anomalies

    async def predict_metrics(self) -> dict[str, float]:
        stmt = (
            select(Trace.start_time, Trace.end_time)
            .order_by(Trace.start_time.desc())
            .limit(1000)
        )
        result = await self.db.execute(stmt)
        trace_rows = list(reversed(result.all()))
        if not trace_rows:
            return {
                "predicted_latency": 0.0,
                "predicted_cost": 0.0,
                "predicted_success_rate": 100.0,
            }

        span_stmt = select(Span.cost, Span.error).limit(1000)
        span_result = await self.db.execute(span_stmt)
        span_rows = span_result.all()

        latencies = [(row[1] - row[0]).total_seconds() for row in trace_rows]
        n = len(trace_rows)

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

        avg_cost = (
            sum(float(row[0]) for row in span_rows) / len(span_rows)
            if span_rows
            else 0.0
        )
        errors = sum(1 for row in span_rows if row[1] is not None)
        success_rate = (
            ((len(span_rows) - errors) / len(span_rows)) * 100.0 if span_rows else 100.0
        )

        return {
            "predicted_latency": float(next_latency),
            "predicted_cost": float(avg_cost * 1.05),
            "predicted_success_rate": float(max(0.0, min(100.0, success_rate))),
        }

    async def get_provider_comparison(self) -> dict[str, Any]:
        stmt = (
            select(
                Span.model_name,
                Span.start_time,
                Span.end_time,
                Span.cost,
                Span.total_tokens,
                Span.error,
            )
            .where(Span.span_type == "llm")
            .order_by(Span.start_time.desc())
            .limit(10000)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        providers: dict[str, dict[str, Any]] = {}
        for row in rows:
            model = row[0] or "unknown"
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

            p_data["avg_latency"].append((row[2] - row[1]).total_seconds())
            p_data["total_cost"] += float(row[3])
            p_data["total_tokens"] += row[4]
            if row[5]:
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
