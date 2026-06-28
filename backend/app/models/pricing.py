from app.models.base import Base
from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class ModelPricing(Base):
    """Database model mapping per-token API inference pricing profiles."""

    __tablename__ = "model_pricing"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    model_name: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    input_token_price_per_1k: Mapped[float] = mapped_column(
        Numeric(10, 6, asdecimal=False), nullable=False
    )
    output_token_price_per_1k: Mapped[float] = mapped_column(
        Numeric(10, 6, asdecimal=False), nullable=False
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Pricing:
    pass
