from app.providers.base import BaseProvider, ProviderFactory, ProviderResponse
from app.providers.ollama import OllamaProvider
from app.providers.openai import OpenAIProvider

ProviderFactory.register("openai", OpenAIProvider)
ProviderFactory.register("ollama", OllamaProvider)

__all__ = [
    "BaseProvider",
    "ProviderResponse",
    "ProviderFactory",
    "OpenAIProvider",
    "OllamaProvider",
]
