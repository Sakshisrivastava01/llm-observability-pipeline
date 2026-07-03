from app.evaluation.base import ScorerFactory
from app.models.evaluation import Evaluation
from app.repositories.evaluation_repository import EvaluationRepository
from sqlalchemy.ext.asyncio import AsyncSession


class EvaluationService:
    def __init__(self, db: AsyncSession):
        self.eval_repo = EvaluationRepository(db)

    async def run_evaluation(
        self,
        trace_id: str,
        scorer_name: str,
        output_text: str,
        context_text: str | None = None,
        reference_text: str | None = None,
        span_id: str | None = None,
    ) -> Evaluation:
        scorer = ScorerFactory.get(scorer_name)
        res = await scorer.score(
            output=output_text, context=context_text, reference=reference_text
        )

        eval_record = Evaluation(
            trace_id=trace_id,
            span_id=span_id,
            metric_name=scorer_name,
            metric_value=res.score,
            status="success",
            feedback=res.feedback,
            custom_metadata=res.metadata,
        )

        await self.eval_repo.create(eval_record)
        return eval_record
