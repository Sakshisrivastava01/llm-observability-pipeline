from abc import ABC, abstractmethod
from typing import Any

import httpx
from pydantic import BaseModel


class ProviderResponse(BaseModel):
    """Normalized response payload schema from any LLM provider."""

    text: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float = 0.0
    raw_response: dict[str, Any] = {}


class BaseProvider(ABC):
    """Abstract interface all LLM provider connectors must implement."""

    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client or httpx.AsyncClient()

    @abstractmethod
    async def generate(
        self, model: str, prompt: str, **kwargs: Any
    ) -> ProviderResponse:
        """Invokes API generation from the LLM provider."""
        pass


class ProviderFactory:
    """Extensible registry and factory for managing concrete provider connectors."""

    _providers: dict[str, type[BaseProvider]] = {}

    @classmethod
    def register(cls, name: str, provider_class: type[BaseProvider]) -> None:
        """Registers a new provider class mapping to a unique identifier."""
        cls._providers[name.lower().strip()] = provider_class

    @classmethod
    def get(cls, name: str, client: httpx.AsyncClient | None = None) -> BaseProvider:
        """Resolves and instantiates a provider connector."""
        provider_class = cls._providers.get(name.lower().strip())
        if not provider_class:
            raise ValueError(f"Unsupported LLM provider connector: {name}")
        return provider_class(client=client)
