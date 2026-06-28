from sqlalchemy.ext.asyncio import AsyncSession


class BaseRepository:
    """Base repository class initializing database sessions."""

    def __init__(self, db: AsyncSession):
        self.db = db
