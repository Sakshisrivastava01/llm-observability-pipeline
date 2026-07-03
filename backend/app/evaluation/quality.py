from typing import Any

from app.evaluation.base import BaseScorer, ScorerFactory, ScorerResult


class QualityScorer(BaseScorer):
    async def score(
        self,
        output: str,
        context: str | None = None,
        reference: str | None = None,
        **kwargs: Any,
    ) -> ScorerResult:
        metrics = ["hallucination", "groundedness", "faithfulness", "similarity"]
        scores = []
        details = []

        for m in metrics:
            try:
                scorer = ScorerFactory.get(m)
                res = await scorer.score(output, context, reference, **kwargs)
                scores.append(res.score)
                details.append(f"{m}: {res.score:.2f}")
            except Exception as e:
                details.append(f"{m} error: {str(e)}")

        score = sum(scores) / len(scores) if scores else 1.0
        feedback = " | ".join(details)

        return ScorerResult(score=score, feedback=feedback)
