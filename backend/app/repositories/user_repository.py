from uuid import UUID

from app.db.models.user import User
from app.repositories.base_repository import BaseRepository
from sqlalchemy import select


class UserRepository(BaseRepository):
    """Handles CRUD operations for Users."""

    async def get_by_email(self, email: str) -> User | None:
        """Retrieves a user by email address."""
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, user_id: UUID) -> User | None:
        """Retrieves a user by ID."""
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create(self, user: User) -> User:
        """Persists a new User."""
        self.db.add(user)
        await self.db.flush()
        return user
