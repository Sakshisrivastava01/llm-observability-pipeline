from typing import Any

from app.core.config import settings
from app.providers.base import BaseProvider, ProviderResponse


class OllamaProvider(BaseProvider):
    """Ollama API connector for executing local inference calls."""

    async def generate(
        self, model: str, prompt: str, **kwargs: Any
    ) -> ProviderResponse:
        url = f"{settings.OLLAMA_API_BASE}/api/generate"

        system_instruction = kwargs.get("system_instruction")
        temperature = kwargs.get("temperature", 0.7)

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if system_instruction:
            payload["system"] = system_instruction

        resp = await self.client.post(url, json=payload, timeout=30.0)
        resp.raise_for_status()
        data = resp.json()

        text = data.get("response", "")
        prompt_tokens = data.get("prompt_eval_count", 0)
        completion_tokens = data.get("eval_count", 0)
        total_tokens = prompt_tokens + completion_tokens

        # Ollama runs locally, so token cost is 0.0
        return ProviderResponse(
            text=text,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost=0.0,
            raw_response=data,
        )
