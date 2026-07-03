from app.models.span import Span
from app.repositories.base_repository import BaseRepository
from sqlalchemy import select


class SpanRepository(BaseRepository):
    async def create(self, span: Span) -> Span:
        try:
            self.db.add(span)
            await self.db.flush()
            return span
        except Exception:
            await self.db.rollback()
            raise

    async def get_by_span_id(self, span_id: str) -> Span | None:
        stmt = select(Span).where(Span.span_id == span_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_trace_id(self, trace_id: str) -> list[Span]:
        stmt = (
            select(Span)
            .where(Span.trace_id == trace_id)
            .order_by(Span.start_time.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
