from app.models.pricing import ModelPricing
from app.repositories.base_repository import BaseRepository
from sqlalchemy import select


class PricingRepository(BaseRepository):
    """Handles CRUD operations for Model Pricing profiles."""

    async def create(self, pricing: ModelPricing) -> ModelPricing:
        """Persists a new pricing profile in a database transaction block."""
        try:
            self.db.add(pricing)
            await self.db.flush()
            return pricing
        except Exception:
            await self.db.rollback()
            raise

    async def get_by_model(self, model_name: str) -> ModelPricing | None:
        """Retrieves the active pricing profile for a specific model name."""
        stmt = select(ModelPricing).where(
            ModelPricing.model_name == model_name, ModelPricing.active.is_(True)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_all(self) -> list[ModelPricing]:
        """Retrieves all registered pricing profiles."""
        stmt = select(ModelPricing).order_by(ModelPricing.model_name.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def upsert_pricing(
        self,
        provider: str,
        model_name: str,
        input_price: float,
        output_price: float,
    ) -> ModelPricing:
        """Creates or updates a model pricing profile configuration."""
        try:
            stmt = select(ModelPricing).where(ModelPricing.model_name == model_name)
            result = await self.db.execute(stmt)
            pricing = result.scalars().first()
            if pricing:
                pricing.provider = provider
                pricing.input_token_price_per_1k = input_price
                pricing.output_token_price_per_1k = output_price
                pricing.active = True
            else:
                pricing = ModelPricing(
                    provider=provider,
                    model_name=model_name,
                    input_token_price_per_1k=input_price,
                    output_token_price_per_1k=output_price,
                    active=True,
                )
                self.db.add(pricing)
            await self.db.flush()
            return pricing
        except Exception:
            await self.db.rollback()
            raise
