from datetime import datetime, timezone
from uuid import UUID

from app.db.models.password_reset import PasswordResetToken
from app.db.models.user import User
from app.repositories.base_repository import BaseRepository
from sqlalchemy import delete, select


class AuthRepository(BaseRepository):
    """Handles authentication and password reset database operations."""

    async def create_password_reset_token(
        self, token: PasswordResetToken
    ) -> PasswordResetToken:
        """Persists a new password reset token."""
        self.db.add(token)
        await self.db.flush()
        return token

    async def delete_unused_tokens_by_user(self, user_id: UUID) -> None:
        """Deletes all unused password reset tokens for a specific user."""
        stmt = delete(PasswordResetToken).where(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.used.is_(False),
        )
        await self.db.execute(stmt)

    async def get_active_token_by_email_and_otp(
        self, email: str, otp: str
    ) -> PasswordResetToken | None:
        """Gets active (unused) password reset token matching user email and OTP."""
        stmt = (
            select(PasswordResetToken)
            .join(User, PasswordResetToken.user_id == User.id)
            .where(
                User.email == email,
                PasswordResetToken.otp == otp,
                PasswordResetToken.used.is_(False),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def delete_expired_tokens(self) -> None:
        """Deletes all expired password reset tokens."""
        now = datetime.now(timezone.utc)
        stmt = delete(PasswordResetToken).where(PasswordResetToken.expires_at < now)
        await self.db.execute(stmt)
