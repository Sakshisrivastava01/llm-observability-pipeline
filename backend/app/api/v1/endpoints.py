from typing import Any

from app.db.session import get_db
from app.providers import ProviderFactory
from app.repositories.pricing_repository import PricingRepository
from app.repositories.trace_repository import TraceRepository
from app.sdk.context import SpanContext, TraceContext
from app.services.analytics_service import AnalyticsService
from app.services.evaluation_service import EvaluationService
from app.services.telemetry_service import TelemetryService
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class InferenceRequest(BaseModel):
    provider: str
    model: str
    prompt: str
    system_instruction: str | None = None
    temperature: float = 0.7
    reference_context: str | None = None
    reference_output: str | None = None


class TracePayload(BaseModel):
    trace_id: str
    name: str
    start_time: str
    end_time: str
    input_data: dict[str, Any]
    output_data: dict[str, Any]
    custom_metadata: dict[str, Any] = {}
    spans: list[dict[str, Any]] = []


class EvaluationRequest(BaseModel):
    trace_id: str
    scorer_name: str
    output_text: str
    context_text: str | None = None
    reference_text: str | None = None
    span_id: str | None = None


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Retrieves operational status of the platform API."""
    return {"status": "healthy"}


@router.post("/traces", status_code=201)
async def ingest_trace(
    payload: TracePayload, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Receives trace payloads directly from the client Telemetry SDK."""
    telemetry_service = TelemetryService(db)
    try:
        await telemetry_service.record_trace(payload.model_dump())
        return {"status": "success", "trace_id": payload.trace_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ingest failed: {str(e)}")


@router.get("/traces")
async def get_traces(
    limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)
) -> list[Any]:
    """Queries paginated ingested traces."""
    trace_repo = TraceRepository(db)
    traces = await trace_repo.get_all(limit=limit, offset=offset)
    return [
        {
            "trace_id": t.trace_id,
            "name": t.name,
            "start_time": t.start_time.isoformat(),
            "end_time": t.end_time.isoformat(),
            "input_data": t.input_data,
            "output_data": t.output_data,
            "custom_metadata": t.custom_metadata,
            "spans_count": len(t.spans),
        }
        for t in traces
    ]


@router.get("/traces/{trace_id}")
async def get_trace(
    trace_id: str, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Retrieves nested hierarchies and evaluation scores of a specific trace."""
    trace_repo = TraceRepository(db)
    trace = await trace_repo.get_by_trace_id(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace record not found")

    return {
        "trace_id": trace.trace_id,
        "name": trace.name,
        "start_time": trace.start_time.isoformat(),
        "end_time": trace.end_time.isoformat(),
        "input_data": trace.input_data,
        "output_data": trace.output_data,
        "custom_metadata": trace.custom_metadata,
        "spans": [
            {
                "span_id": s.span_id,
                "parent_span_id": s.parent_span_id,
                "name": s.name,
                "span_type": s.span_type,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "input_data": s.input_data,
                "output_data": s.output_data,
                "model_name": s.model_name,
                "prompt_tokens": s.prompt_tokens,
                "completion_tokens": s.completion_tokens,
                "total_tokens": s.total_tokens,
                "cost": float(s.cost),
                "error": s.error,
                "custom_metadata": s.custom_metadata,
            }
            for s in trace.spans
        ],
        "evaluations": [
            {
                "id": str(ev.id),
                "metric_name": ev.metric_name,
                "metric_value": ev.metric_value,
                "status": ev.status,
                "feedback": ev.feedback,
                "timestamp": ev.timestamp.isoformat(),
            }
            for ev in trace.evaluations
        ],
    }


@router.post("/evaluations/run", status_code=201)
async def run_evaluation(
    req: EvaluationRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Manually triggers evaluation scoring on a generated response output."""
    eval_service = EvaluationService(db)
    try:
        record = await eval_service.run_evaluation(
            trace_id=req.trace_id,
            span_id=req.span_id,
            scorer_name=req.scorer_name,
            output_text=req.output_text,
            context_text=req.context_text,
            reference_text=req.reference_text,
        )
        return {
            "status": "success",
            "evaluation_id": str(record.id),
            "metric_name": record.metric_name,
            "metric_value": record.metric_value,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Evaluation failed: {str(e)}")


@router.get("/evaluations")
async def get_evaluations(
    limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)
) -> list[Any]:
    """Retrieves all evaluation logs."""
    eval_service = EvaluationService(db)
    records = await eval_service.eval_repo.get_all(limit=limit, offset=offset)
    return [
        {
            "id": str(r.id),
            "trace_id": r.trace_id,
            "span_id": r.span_id,
            "metric_name": r.metric_name,
            "metric_value": r.metric_value,
            "status": r.status,
            "feedback": r.feedback,
            "timestamp": r.timestamp.isoformat(),
        }
        for r in records
    ]


@router.get("/analytics/kpis")
async def get_analytics_kpis(
    db: AsyncSession = Depends(get_db),
) -> dict[str, float]:
    """Retrieves system-wide KPI metrics."""
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_kpis()


@router.get("/analytics/models")
async def get_model_shares(
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    """Retrieves query distribution per LLM model."""
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_model_distribution()


@router.get("/analytics/regressions")
async def get_regressions(
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    """Checks for active duration/latency regression triggers."""
    analytics_service = AnalyticsService(db)
    return await analytics_service.detect_regressions()


@router.post("/inference")
async def execute_inference(
    req: InferenceRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Proxies LLM calls, tracking prompts, outputs, latency, tokens, cost, and evaluates quality."""
    pricing_repo = PricingRepository(db)
    eval_service = EvaluationService(db)

    # 1. Fetch active pricing profile
    price_info = await pricing_repo.get_by_model(req.model)
    in_price = price_info.input_token_price_per_1k if price_info else 0.0015
    out_price = price_info.output_token_price_per_1k if price_info else 0.002

    provider = ProviderFactory.get(req.provider)

    # 2. Track trace context
    async with TraceContext(
        name="proxy_inference_pipeline",
        input_data={"prompt": req.prompt},
        custom_metadata={"environment": "production"},
    ) as tc:
        async with SpanContext(
            name="completion_step",
            span_type="llm",
            model_name=req.model,
            input_data={"prompt": req.prompt},
        ) as sc:
            # 3. Call LLM connector
            resp = await provider.generate(
                model=req.model,
                prompt=req.prompt,
                system_instruction=req.system_instruction,
                temperature=req.temperature,
            )

            # 4. Calculate usage pricing
            cost = (
                (resp.prompt_tokens * in_price) + (resp.completion_tokens * out_price)
            ) / 1000.0
            sc.set_usage(
                prompt_tokens=resp.prompt_tokens,
                completion_tokens=resp.completion_tokens,
                cost=cost,
            )

            # Record generation outputs
            sc.output_data = {"response": resp.text}
            tc.output_data = {"response": resp.text}

    # 5. Automatically trigger quality scores evaluations
    eval_results = []
    if req.reference_context:
        # Run Groundedness & Hallucination Check
        for scorer in ["hallucination", "groundedness", "faithfulness"]:
            try:
                ev = await eval_service.run_evaluation(
                    trace_id=tc.trace_id,
                    span_id=sc.span_id,
                    scorer_name=scorer,
                    output_text=resp.text,
                    context_text=req.reference_context,
                )
                eval_results.append(
                    {
                        "metric_name": ev.metric_name,
                        "metric_value": ev.metric_value,
                        "status": ev.status,
                    }
                )
            except Exception:
                pass

    if req.reference_output:
        # Run Semantic Similarity check
        try:
            ev = await eval_service.run_evaluation(
                trace_id=tc.trace_id,
                span_id=sc.span_id,
                scorer_name="similarity",
                output_text=resp.text,
                reference_text=req.reference_output,
            )
            eval_results.append(
                {
                    "metric_name": ev.metric_name,
                    "metric_value": ev.metric_value,
                    "status": ev.status,
                }
            )
        except Exception:
            pass

    # Run overall quality evaluation scorer
    try:
        ev = await eval_service.run_evaluation(
            trace_id=tc.trace_id,
            span_id=sc.span_id,
            scorer_name="quality",
            output_text=resp.text,
            context_text=req.reference_context,
            reference_text=req.reference_output,
        )
        eval_results.append(
            {
                "metric_name": ev.metric_name,
                "metric_value": ev.metric_value,
                "status": ev.status,
            }
        )
    except Exception:
        pass

    return {
        "trace_id": tc.trace_id,
        "response": resp.text,
        "tokens": {
            "prompt": resp.prompt_tokens,
            "completion": resp.completion_tokens,
            "total": resp.total_tokens,
        },
        "cost": cost,
        "evaluations": eval_results,
    }


@router.get("/alerts")
async def get_alerts(
    limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)
) -> list[Any]:
    """Retrieves all logged operational alerts."""
    from app.repositories.alert_repository import AlertRepository

    alert_repo = AlertRepository(db)
    alerts = await alert_repo.get_all(limit=limit, offset=offset)
    return [
        {
            "id": str(a.id),
            "metric_name": a.metric_name,
            "threshold_value": a.threshold_value,
            "actual_value": a.actual_value,
            "severity": a.severity,
            "status": a.status,
            "description": a.description,
            "timestamp": a.timestamp.isoformat(),
        }
        for a in alerts
    ]
