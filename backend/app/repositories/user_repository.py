from uuid import UUID

from app.db.models.user import User
from app.repositories.base_repository import BaseRepository
from sqlalchemy import select


class UserRepository(BaseRepository):
    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, user_id: UUID) -> User | None:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        return user
