from app.models.alert import Alert
from app.repositories.base_repository import BaseRepository
from sqlalchemy import select


class AlertRepository(BaseRepository):
    async def create(self, alert: Alert) -> Alert:
        try:
            self.db.add(alert)
            await self.db.flush()
            return alert
        except Exception:
            await self.db.rollback()
            raise

    async def get_all(self, limit: int = 100, offset: int = 0) -> list[Alert]:
        stmt = (
            select(Alert).order_by(Alert.timestamp.desc()).limit(limit).offset(offset)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_active(self) -> list[Alert]:
        stmt = (
            select(Alert)
            .where(Alert.status == "active")
            .order_by(Alert.timestamp.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def acknowledge(self, alert_id: str) -> Alert | None:
        import uuid

        try:
            alert_uuid = uuid.UUID(alert_id)
            stmt = select(Alert).where(Alert.id == alert_uuid)
            result = await self.db.execute(stmt)
            alert = result.scalars().first()
            if alert:
                alert.status = "acknowledged"
                await self.db.flush()
            return alert
        except Exception:
            await self.db.rollback()
            raise
