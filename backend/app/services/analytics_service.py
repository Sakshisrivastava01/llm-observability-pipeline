from app.models.evaluation import Evaluation
from app.models.span import Span
from app.models.trace import Trace
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession


class AnalyticsService:
    """Calculates operational indicators, throughput aggregations, token budgets, and regression triggers."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_kpis(self) -> dict[str, float]:
        """Calculates system-wide KPIs: request volume, mean latency, token count, aggregate cost, and success rate."""
        # 1. Get total request count
        count_stmt = select(func.count(Trace.id))
        total_requests = (await self.db.execute(count_stmt)).scalar() or 0

        if total_requests == 0:
            return {
                "total_requests": 0.0,
                "avg_latency": 0.0,
                "total_tokens": 0.0,
                "total_cost": 0.0,
                "success_rate": 100.0,
            }

        # 2. Get average latency of traces (limited to last 10000 traces for safety, calculated via SQL if supported)
        # To remain database-agnostic (SQLite vs PG interval difference), fetch only the start/end timestamps of recent traces.
        trace_stmt = (
            select(Trace.start_time, Trace.end_time)
            .order_by(Trace.start_time.desc())
            .limit(10000)
        )
        trace_result = await self.db.execute(trace_stmt)
        trace_rows = trace_result.all()

        latencies = [(row[1] - row[0]).total_seconds() for row in trace_rows]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

        # 3. Perform fully aggregated SQL query on spans table to fetch tokens, cost, and error counts
        span_stmt = select(
            func.sum(Span.total_tokens),
            func.sum(Span.cost),
            func.sum(case((Span.error.isnot(None), 1), else_=0)),
        )
        span_result = await self.db.execute(span_stmt)
        total_tokens, total_cost, errors = span_result.first() or (0, 0.0, 0)

        total_tokens = total_tokens or 0
        total_cost = float(total_cost or 0.0)
        errors = errors or 0

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
        # Limit regression check query to the most recent 1000 traces to prevent full table scans
        stmt = (
            select(Trace.start_time, Trace.end_time)
            .order_by(Trace.start_time.desc())
            .limit(1000)
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        if not rows or len(rows) < 10:
            return {"regression_detected": False}

        latencies = sorted([(row[1] - row[0]).total_seconds() for row in rows])
        p95 = latencies[int(len(latencies) * 0.95)]

        # Baseline mean latency of recent requests
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
