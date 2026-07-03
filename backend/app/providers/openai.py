from typing import Any

import httpx
from app.core.config import settings
from app.providers.base import BaseProvider, ProviderResponse


class OpenAIProvider(BaseProvider):
    async def generate(
        self, model: str, prompt: str, **kwargs: Any
    ) -> ProviderResponse:
        url = f"{settings.OPENAI_API_BASE}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }

        system_instruction = kwargs.get("system_instruction")
        temperature = kwargs.get("temperature", 0.7)

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        from app.core.circuit_breaker import CircuitBreakerRegistry

        breaker = CircuitBreakerRegistry.get_breaker("openai")

        async def _make_call() -> httpx.Response:
            r = await self.client.post(url, headers=headers, json=payload, timeout=15.0)
            r.raise_for_status()
            return r

        resp = await breaker.call(_make_call)
        data = resp.json()

        choice = data["choices"][0]
        text = choice["message"]["content"]

        usage = data.get("usage", {})
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", 0)

        input_price = 0.005 if "gpt-4" in model else 0.0015
        output_price = 0.015 if "gpt-4" in model else 0.002
        cost = (
            (prompt_tokens * input_price) + (completion_tokens * output_price)
        ) / 1000.0

        return ProviderResponse(
            text=text,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost=cost,
            raw_response=data,
        )
