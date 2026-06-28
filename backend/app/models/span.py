import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from app.models.base import Base
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.trace import Trace


class Span(Base):
    """Database model mapping execution spans (e.g. LLM calls, tools, retrieval)."""

    __tablename__ = "span"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    span_id: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    trace_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("trace.trace_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    parent_span_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    span_type: Mapped[str] = mapped_column(String(100), nullable=False)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    input_data: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )
    output_data: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )
    model_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cost: Mapped[float] = mapped_column(
        Numeric(10, 6, asdecimal=False), default=0.0, nullable=False
    )
    error: Mapped[str | None] = mapped_column(String, nullable=True)
    custom_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )

    # Relationships
    trace: Mapped["Trace"] = relationship("Trace", back_populates="spans")
