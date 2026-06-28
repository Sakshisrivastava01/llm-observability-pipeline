from datetime import datetime
from typing import Any

from app.models.span import Span
from app.models.trace import Trace
from app.repositories.base_repository import BaseRepository
from sqlalchemy import select


class TraceRepository(BaseRepository):
    """Handles CRUD and queries for Traces and nested Spans in the database."""

    def _parse_dt(self, val: str | datetime) -> datetime:
        """Helper to parse datetime strings with timezone safety (Z compatibility for Python < 3.11)."""
        if isinstance(val, str):
            if val.endswith("Z"):
                val = val[:-1] + "+00:00"
            return datetime.fromisoformat(val)
        return val

    async def create(self, data: dict[str, Any]) -> Trace:
        """Persists a new Trace along with its nested child Spans in a safe transaction block."""
        try:
            start_time = self._parse_dt(data["start_time"])
            end_time = self._parse_dt(data["end_time"])

            trace = Trace(
                trace_id=data["trace_id"],
                name=data["name"],
                start_time=start_time,
                end_time=end_time,
                input_data=data.get("input_data", {}),
                output_data=data.get("output_data", {}),
                custom_metadata=data.get("custom_metadata", {}),
            )
            self.db.add(trace)
            await self.db.flush()

            # Append nested spans if present in payload
            if "spans" in data:
                for span_data in data["spans"]:
                    s_start = self._parse_dt(span_data["start_time"])
                    s_end = self._parse_dt(span_data["end_time"])

                    cost = span_data.get("cost", 0.0)
                    if cost == 0.0 and span_data.get("prompt_tokens"):
                        pt = span_data.get("prompt_tokens", 0)
                        ct = span_data.get("completion_tokens", 0)
                        input_price = (
                            0.005
                            if "gpt-4" in str(span_data.get("model_name"))
                            else 0.0015
                        )
                        output_price = (
                            0.015
                            if "gpt-4" in str(span_data.get("model_name"))
                            else 0.002
                        )
                        cost = ((pt * input_price) + (ct * output_price)) / 1000.0

                    span = Span(
                        span_id=span_data["span_id"],
                        trace_id=trace.trace_id,
                        parent_span_id=span_data.get("parent_span_id"),
                        name=span_data["name"],
                        span_type=span_data["span_type"],
                        start_time=s_start,
                        end_time=s_end,
                        input_data=span_data.get("input_data", {}),
                        output_data=span_data.get("output_data", {}),
                        model_name=span_data.get("model_name"),
                        prompt_tokens=span_data.get("prompt_tokens", 0),
                        completion_tokens=span_data.get("completion_tokens", 0),
                        total_tokens=span_data.get("total_tokens", 0),
                        cost=cost,
                        error=span_data.get("error"),
                        custom_metadata=span_data.get("custom_metadata", {}),
                    )
                    self.db.add(span)

            await self.db.flush()
            return trace
        except Exception:
            await self.db.rollback()
            raise

    async def get_all(self, limit: int = 100, offset: int = 0) -> list[Trace]:
        """Retrieves a list of traces ordered by start time descending."""
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Trace)
            .options(selectinload(Trace.spans))
            .order_by(Trace.start_time.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_trace_id(self, trace_id: str) -> Trace | None:
        """Finds a single trace by its unique trace identifier string."""
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Trace)
            .options(selectinload(Trace.spans), selectinload(Trace.evaluations))
            .where(Trace.trace_id == trace_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()
