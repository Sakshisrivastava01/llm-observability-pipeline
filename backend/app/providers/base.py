from abc import ABC, abstractmethod
from typing import Any

import httpx
from pydantic import BaseModel


class ProviderResponse(BaseModel):
    text: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float = 0.0
    raw_response: dict[str, Any] = {}


class BaseProvider(ABC):
    def __init__(self, client: httpx.AsyncClient | None = None):
        self.client = client or httpx.AsyncClient()

    @abstractmethod
    async def generate(
        self, model: str, prompt: str, **kwargs: Any
    ) -> ProviderResponse:
        pass


class ProviderFactory:
    _providers: dict[str, type[BaseProvider]] = {}

    @classmethod
    def register(cls, name: str, provider_class: type[BaseProvider]) -> None:
        cls._providers[name.lower().strip()] = provider_class

    @classmethod
    def get(cls, name: str, client: httpx.AsyncClient | None = None) -> BaseProvider:
        provider_class = cls._providers.get(name.lower().strip())
        if not provider_class:
            raise ValueError(f"Unsupported LLM provider connector: {name}")
        return provider_class(client=client)
