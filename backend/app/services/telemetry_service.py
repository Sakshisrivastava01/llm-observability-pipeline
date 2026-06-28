from datetime import datetime
from typing import Any

from app.core.logging import logger
from app.models.alert import Alert
from app.models.trace import Trace
from app.repositories.alert_repository import AlertRepository
from app.repositories.trace_repository import TraceRepository
from sqlalchemy.ext.asyncio import AsyncSession


class TelemetryService:
    """Orchestrates ingestion of traces, saves spans, and runs trigger threshold alerts."""

    def __init__(self, db: AsyncSession):
        self.trace_repo = TraceRepository(db)
        self.alert_repo = AlertRepository(db)

    async def record_trace(self, data: dict[str, Any]) -> Trace:
        """Saves telemetry payload and checks if latency or token cost rules trigger new alerts."""
        trace = await self.trace_repo.create(data)

        # Parse duration metrics
        start = (
            datetime.fromisoformat(data["start_time"])
            if isinstance(data["start_time"], str)
            else data["start_time"]
        )
        end = (
            datetime.fromisoformat(data["end_time"])
            if isinstance(data["end_time"], str)
            else data["end_time"]
        )
        duration = (end - start).total_seconds()

        # Latency operational alerts rules
        if duration > 5.0:
            severity = "critical" if duration > 10.0 else "warning"
            alert = Alert(
                metric_name="latency_seconds",
                threshold_value=5.0,
                actual_value=duration,
                severity=severity,
                status="active",
                description=(
                    f"Trace '{trace.name}' (ID: {trace.trace_id}) execution time "
                    f"was {duration:.2f}s, exceeding 5.0s rule threshold."
                ),
            )
            await self.alert_repo.create(alert)
            logger.info(
                "telemetry_service_latency_alert",
                duration=duration,
                trace_id=trace.trace_id,
            )

        # Cost limit alerts rules
        total_cost = sum(float(span.get("cost", 0.0)) for span in data.get("spans", []))
        if total_cost > 0.05:
            alert = Alert(
                metric_name="cost_dollars",
                threshold_value=0.05,
                actual_value=total_cost,
                severity="warning",
                status="active",
                description=(
                    f"Trace '{trace.name}' accumulated a total cost of "
                    f"${total_cost:.4f}, exceeding transaction threshold."
                ),
            )
            await self.alert_repo.create(alert)
            logger.info(
                "telemetry_service_cost_alert",
                cost=total_cost,
                trace_id=trace.trace_id,
            )

        return trace
