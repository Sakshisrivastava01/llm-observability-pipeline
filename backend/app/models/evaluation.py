import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from app.models.base import Base
from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.trace import Trace


class Evaluation(Base):
    __tablename__ = "evaluation"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    trace_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("trace.trace_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    span_id: Mapped[str | None] = mapped_column(
        String(255),
        ForeignKey("span.span_id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    metric_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    metric_value: Mapped[float] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="success", nullable=False)
    feedback: Mapped[str | None] = mapped_column(nullable=True)
    custom_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    trace: Mapped["Trace"] = relationship("Trace", back_populates="evaluations")
