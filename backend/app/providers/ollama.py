from typing import Any

import httpx
from app.core.config import settings
from app.providers.base import BaseProvider, ProviderResponse


class OllamaProvider(BaseProvider):
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

        from app.core.circuit_breaker import CircuitBreakerRegistry

        breaker = CircuitBreakerRegistry.get_breaker("ollama")

        async def _make_call() -> httpx.Response:
            r = await self.client.post(url, json=payload, timeout=30.0)
            r.raise_for_status()
            return r

        resp = await breaker.call(_make_call)
        data = resp.json()

        text = data.get("response", "")
        prompt_tokens = data.get("prompt_eval_count", 0)
        completion_tokens = data.get("eval_count", 0)
        total_tokens = prompt_tokens + completion_tokens

        return ProviderResponse(
            text=text,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost=0.0,
            raw_response=data,
        )
