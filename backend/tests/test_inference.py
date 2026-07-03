from unittest.mock import AsyncMock, patch

import pytest
from app.providers.base import ProviderResponse


@pytest.mark.anyio
async def test_inference_proxy_pipeline(client) -> None:
    mock_response = ProviderResponse(
        text="FastAPI is an asynchronous web framework.",
        prompt_tokens=10,
        completion_tokens=8,
        total_tokens=18,
        cost=0.0001,
        raw_response={},
    )

    with (
        patch(
            "app.providers.openai.OpenAIProvider.generate",
            new_callable=AsyncMock,
        ) as mock_gen,
        patch(
            "app.evaluation.base.LLMBaseScorer._evaluate_llm",
            new_callable=AsyncMock,
        ) as mock_eval,
    ):
        mock_gen.return_value = mock_response
        mock_eval.return_value = {
            "score": 0.98,
            "reason": "Accurate fact checking.",
        }

        payload = {
            "provider": "openai",
            "model": "gpt-3.5-turbo",
            "prompt": "What is FastAPI?",
            "reference_context": "FastAPI is a fast web framework.",
            "reference_output": "FastAPI is an async framework.",
        }

        response = await client.post("/api/v1/inference", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert "trace_id" in data
        assert "response" in data
        assert data["response"] == "FastAPI is an asynchronous web framework."
        assert len(data["evaluations"]) > 0
        metrics = [e["metric_name"] for e in data["evaluations"]]
        assert "quality" in metrics
        assert "hallucination" in metrics
