from app.models.evaluation import Evaluation
from app.models.span import Span
from app.models.trace import Trace
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class AnalyticsService:
    """Calculates operational indicators, throughput aggregations, token budgets, and regression triggers."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_kpis(self) -> dict[str, float]:
        """Calculates system-wide KPIs: request volume, mean latency, token count, aggregate cost, and success rate."""
        stmt = select(Trace)
        result = await self.db.execute(stmt)
        traces = result.scalars().all()

        if not traces:
            return {
                "total_requests": 0.0,
                "avg_latency": 0.0,
                "total_tokens": 0.0,
                "total_cost": 0.0,
                "success_rate": 100.0,
            }

        total_requests = len(traces)
        latencies = [(t.end_time - t.start_time).total_seconds() for t in traces]
        avg_latency = sum(latencies) / total_requests

        # Fetch spans to sum costs and tokens
        span_stmt = select(Span)
        span_result = await self.db.execute(span_stmt)
        spans = span_result.scalars().all()

        total_tokens = sum(s.total_tokens for s in spans)
        total_cost = sum(s.cost for s in spans)

        # Count errors in traces or spans
        errors = sum(1 for s in spans if s.error is not None)
        success_rate = (
            ((total_requests - errors) / total_requests) * 100.0
            if total_requests
            else 100.0
        )

        return {
            "total_requests": float(total_requests),
            "avg_latency": avg_latency,
            "total_tokens": float(total_tokens),
            "total_cost": total_cost,
            "success_rate": success_rate,
        }

    async def get_model_distribution(self) -> dict[str, int]:
        """Calculates completions volume distribution across configured models."""
        stmt = select(Span.model_name)
        result = await self.db.execute(stmt)
        models = [m for m in result.scalars().all() if m is not None]

        dist: dict[str, int] = {}
        for m in models:
            dist[m] = dist.get(m, 0) + 1
        return dist

    async def detect_regressions(self) -> dict[str, bool]:
        """Compares recent request durations against baseline P95 latency to trigger warning triggers."""
        stmt = select(Trace)
        result = await self.db.execute(stmt)
        traces = result.scalars().all()

        if not traces or len(traces) < 10:
            return {"regression_detected": False}

        latencies = sorted(
            [(t.end_time - t.start_time).total_seconds() for t in traces]
        )
        p95 = latencies[int(len(latencies) * 0.95)]

        # Baseline mean latency
        baseline = sum(latencies) / len(latencies)

        # Flag regression if P95 is more than 2x baseline
        detected = p95 > (2.0 * baseline)
        return {"regression_detected": bool(detected)}

    async def get_evaluation_averages(self) -> dict[str, float]:
        """Averages scores across metric categories."""
        stmt = select(Evaluation)
        result = await self.db.execute(stmt)
        evals = result.scalars().all()

        averages: dict[str, list[float]] = {}
        for ev in evals:
            averages.setdefault(ev.metric_name, []).append(ev.metric_value)

        return {
            metric: sum(scores) / len(scores) for metric, scores in averages.items()
        }
