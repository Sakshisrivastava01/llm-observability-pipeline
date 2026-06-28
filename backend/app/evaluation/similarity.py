from typing import Any

from app.evaluation.base import BaseScorer, ScorerResult


class SemanticSimilarityScorer(BaseScorer):
    """Calculates semantic similarity via lightweight word-level Jaccard overlap."""

    async def score(
        self,
        output: str,
        context: str | None = None,
        reference: str | None = None,
        **kwargs: Any,
    ) -> ScorerResult:
        ref = reference or context or ""
        if not ref.strip():
            return ScorerResult(
                score=0.0,
                feedback="No reference target text provided for similarity check.",
            )

        set1 = set(output.lower().split())
        set2 = set(ref.lower().split())

        intersection = set1.intersection(set2)
        union = set1.union(set2)

        score = len(intersection) / len(union) if union else 0.0

        return ScorerResult(
            score=score,
            feedback=f"Calculated word-overlap similarity coefficient: {score:.4f}",
        )
