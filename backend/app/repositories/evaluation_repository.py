import uuid

from app.models.evaluation import Evaluation
from app.repositories.base_repository import BaseRepository
from sqlalchemy import select


class EvaluationRepository(BaseRepository):
    async def create(self, evaluation: Evaluation) -> Evaluation:
        try:
            self.db.add(evaluation)
            await self.db.flush()
            return evaluation
        except Exception:
            await self.db.rollback()
            raise

    async def get_by_id(self, evaluation_id: uuid.UUID | str) -> Evaluation | None:
        if isinstance(evaluation_id, str):
            evaluation_id = uuid.UUID(evaluation_id)
        stmt = select(Evaluation).where(Evaluation.id == evaluation_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_trace_id(self, trace_id: str) -> list[Evaluation]:
        stmt = (
            select(Evaluation)
            .where(Evaluation.trace_id == trace_id)
            .order_by(Evaluation.timestamp.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all(self, limit: int = 100, offset: int = 0) -> list[Evaluation]:
        stmt = (
            select(Evaluation)
            .order_by(Evaluation.timestamp.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
