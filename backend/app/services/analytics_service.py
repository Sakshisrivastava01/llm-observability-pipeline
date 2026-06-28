from app.models.evaluation import Evaluation
from app.models.span import Span
from app.models.trace import Trace
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


class AnalyticsService:
    """Calculates operational indicators, throughput aggregations, token budgets, and regression triggers."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_kpis(self) -> dict[str, float]:
        """Calculates system-wide KPIs: request volume, mean latency, token count, aggregate cost, and success rate."""
        # Query only timestamps to avoid full Trace entity initialization overhead
        trace_stmt = select(Trace.start_time, Trace.end_time)
        trace_result = await self.db.execute(trace_stmt)
        trace_rows = trace_result.all()

        if not trace_rows:
            return {
                "total_requests": 0.0,
                "avg_latency": 0.0,
                "total_tokens": 0.0,
                "total_cost": 0.0,
                "success_rate": 100.0,
            }

        total_requests = len(trace_rows)
        latencies = [(row[1] - row[0]).total_seconds() for row in trace_rows]
        avg_latency = sum(latencies) / total_requests

        # Query specific attributes from spans rather than full entities
        span_stmt = select(Span.total_tokens, Span.cost, Span.error)
        span_result = await self.db.execute(span_stmt)
        span_rows = span_result.all()

        total_tokens = sum(row[0] for row in span_rows)
        total_cost = sum(float(row[1]) for row in span_rows)

        # Count errors based on non-null error column
        errors = sum(1 for row in span_rows if row[2] is not None)
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
        """Calculates completions volume distribution across configured models grouped in SQL."""
        stmt = select(Span.model_name, func.count(Span.id)).group_by(Span.model_name)
        result = await self.db.execute(stmt)
        return {row[0]: row[1] for row in result.all() if row[0] is not None}

    async def detect_regressions(self) -> dict[str, bool]:
        """Compares recent request durations against baseline P95 latency to trigger warnings."""
        stmt = select(Trace.start_time, Trace.end_time)
        result = await self.db.execute(stmt)
        rows = result.all()

        if not rows or len(rows) < 10:
            return {"regression_detected": False}

        latencies = sorted([(row[1] - row[0]).total_seconds() for row in rows])
        p95 = latencies[int(len(latencies) * 0.95)]

        # Baseline mean latency
        baseline = sum(latencies) / len(latencies)

        # Flag regression if P95 is more than 2x baseline
        detected = p95 > (2.0 * baseline)
        return {"regression_detected": bool(detected)}

    async def get_evaluation_averages(self) -> dict[str, float]:
        """Averages scores across metric categories grouped directly in database."""
        stmt = select(
            Evaluation.metric_name, func.avg(Evaluation.metric_value)
        ).group_by(Evaluation.metric_name)
        result = await self.db.execute(stmt)
        return {row[0]: float(row[1]) for row in result.all() if row[0] is not None}
