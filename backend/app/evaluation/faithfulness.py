from typing import Any

from app.evaluation.base import LLMBaseScorer, ScorerResult


class FaithfulnessScorer(LLMBaseScorer):
    """Evaluates if the response is faithful to the retrieval context."""

    async def score(
        self,
        output: str,
        context: str | None = None,
        reference: str | None = None,
        **kwargs: Any,
    ) -> ScorerResult:
        ctx = context or reference or "No context provided."
        template = self._read_prompt_template("faithfulness")
        prompt = template.replace("[CONTEXT]", ctx).replace("[OUTPUT]", output)

        res = await self._evaluate_llm(prompt)
        return ScorerResult(score=res["score"], feedback=res["reason"])
