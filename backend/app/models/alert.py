import uuid
from datetime import datetime, timezone

from app.models.base import Base
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column


class Alert(Base):
    __tablename__ = "alert"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    metric_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    threshold_value: Mapped[float] = mapped_column(nullable=False)
    actual_value: Mapped[float] = mapped_column(nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
