import uuid

from app.models.evaluation import Evaluation
from app.repositories.base_repository import BaseRepository
from sqlalchemy import select


class EvaluationRepository(BaseRepository):
    """Handles CRUD operations for evaluation metrics in the database."""

    async def create(self, evaluation: Evaluation) -> Evaluation:
        """Persists a new evaluation record in a database transaction block."""
        try:
            self.db.add(evaluation)
            await self.db.flush()
            return evaluation
        except Exception:
            await self.db.rollback()
            raise

    async def get_by_id(self, evaluation_id: uuid.UUID | str) -> Evaluation | None:
        """Retrieves a single evaluation record by its UUID."""
        if isinstance(evaluation_id, str):
            evaluation_id = uuid.UUID(evaluation_id)
        stmt = select(Evaluation).where(Evaluation.id == evaluation_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_trace_id(self, trace_id: str) -> list[Evaluation]:
        """Retrieves all evaluations logged for a specific trace, sorted by timestamp descending."""
        stmt = (
            select(Evaluation)
            .where(Evaluation.trace_id == trace_id)
            .order_by(Evaluation.timestamp.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all(self, limit: int = 100, offset: int = 0) -> list[Evaluation]:
        """Retrieves a paginated list of evaluation records."""
        stmt = (
            select(Evaluation)
            .order_by(Evaluation.timestamp.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class EvaluationRepo:
    pass
