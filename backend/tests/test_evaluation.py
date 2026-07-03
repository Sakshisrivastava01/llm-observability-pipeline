from unittest.mock import AsyncMock, patch

import pytest
from app.evaluation.base import ScorerFactory
from app.evaluation.similarity import SemanticSimilarityScorer


@pytest.mark.anyio
async def test_semantic_similarity_scorer() -> None:
    scorer = ScorerFactory.get("similarity")
    assert isinstance(scorer, SemanticSimilarityScorer)

    res1 = await scorer.score(
        "Quantum computing is fast", reference="Quantum computing is fast"
    )
    assert res1.score == 1.0

    res2 = await scorer.score("Quantum computer", reference="Quantum mechanics study")
    assert res2.score == 0.25


@pytest.mark.anyio
async def test_llm_based_scorers() -> None:
    with patch(
        "app.evaluation.base.LLMBaseScorer._evaluate_llm",
        new_callable=AsyncMock,
    ) as mock_eval:
        mock_eval.return_value = {
            "score": 0.9,
            "reason": "Claims are fully grounded.",
        }

        ground_scorer = ScorerFactory.get("groundedness")
        res = await ground_scorer.score(
            output="He resides in Paris", context="Paris is his home"
        )

        assert res.score == 0.9
        assert res.feedback == "Claims are fully grounded."
