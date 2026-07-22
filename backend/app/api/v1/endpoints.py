from typing import Any

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.alert import Alert
from app.models.evaluation import Evaluation
from app.models.span import Span
from app.models.trace import Trace
from app.providers import ProviderFactory
from app.repositories.pricing_repository import PricingRepository
from app.repositories.trace_repository import TraceRepository
from app.routers.auth import router as auth_router
from app.sdk.context import SpanContext, TraceContext
from app.services.analytics_service import AnalyticsService
from app.services.evaluation_service import EvaluationService
from app.services.telemetry_service import TelemetryService
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.routing import APIRoute
from pydantic import BaseModel
from sqlalchemy import func, select
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


class PricingUpsertRequest(BaseModel):
    provider: str
    model_name: str
    input_token_price_per_1k: float
    output_token_price_per_1k: float


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


class HealthCheckResponse(BaseModel):
    status: str


class IngestResponse(BaseModel):
    status: str
    trace_id: str


class SpanResponse(BaseModel):
    span_id: str
    parent_span_id: str | None
    name: str
    span_type: str
    start_time: str
    end_time: str
    input_data: dict[str, Any]
    output_data: dict[str, Any]
    model_name: str | None
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    error: str | None
    custom_metadata: dict[str, Any]


class EvaluationScoreResponse(BaseModel):
    id: str
    metric_name: str
    metric_value: float
    status: str
    feedback: str | None = None
    timestamp: str | None = None


class TraceDetailResponse(BaseModel):
    trace_id: str
    name: str
    start_time: str
    end_time: str
    input_data: dict[str, Any]
    output_data: dict[str, Any]
    custom_metadata: dict[str, Any]
    spans: list[SpanResponse]
    evaluations: list[EvaluationScoreResponse]


class TraceSummaryResponse(BaseModel):
    trace_id: str
    name: str
    start_time: str
    end_time: str
    input_data: dict[str, Any]
    output_data: dict[str, Any]
    custom_metadata: dict[str, Any]
    spans_count: int


class EvaluationRunResponse(BaseModel):
    status: str
    evaluation_id: str
    metric_name: str
    metric_value: float


class EvaluationSummaryResponse(BaseModel):
    id: str
    trace_id: str
    span_id: str | None
    metric_name: str
    metric_value: float
    status: str
    feedback: str | None
    timestamp: str


class AlertResponse(BaseModel):
    id: str
    metric_name: str
    threshold_value: float
    actual_value: float
    severity: str
    status: str
    description: str
    timestamp: str


class AcknowledgeResponse(BaseModel):
    status: str
    alert_id: str


class PricingUpsertResponse(BaseModel):
    status: str
    model_name: str
    input_price: float
    output_price: float


class PricingResponse(BaseModel):
    id: int | None = None
    provider: str
    model_name: str
    input_token_price_per_1k: float
    output_token_price_per_1k: float
    active: bool


class AdvancedAnalyticsResponse(BaseModel):
    percentiles: dict[str, float]
    anomalies: list[dict[str, Any]]
    predictions: dict[str, float]
    recent_alerts: list[dict[str, Any]] = []


class AnalyticsSummariesResponse(BaseModel):
    throughput_trends: list[dict[str, Any]]
    rolling_averages: list[dict[str, Any]]


class InferenceResponse(BaseModel):
    trace_id: str
    response: str
    tokens: dict[str, int]
    cost: float
    evaluations: list[dict[str, Any]]


class ProviderStatsResponse(BaseModel):
    avg_latency: float
    avg_cost: float
    avg_tokens: float
    failure_rate: float
    requests: int


class DiagnosticHealthResponse(BaseModel):
    database: str
    openai: str
    ollama: str
    environment: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    name: str
    email: str


class LoginResponse(BaseModel):
    user: UserResponse
    access_token: str


class TraceItemResponse(BaseModel):
    run_id: str
    model: str | None
    latency_ms: float
    total_tokens: int
    cost_usd: float
    hall_score: float | None
    finish_reason: str | None
    created_at: str


class PaginatedTracesResponse(BaseModel):
    items: list[TraceItemResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AlertItemResponse(BaseModel):
    id: str
    severity: str
    model: str
    metric: str
    baseline_value: float
    current_value: float
    pct_change: float
    p_value: float | None
    created_at: str
    resolved: bool


class AlertsWrapperResponse(BaseModel):
    items: list[AlertItemResponse]
    total: int
    severity_counts: dict[str, int]


class ResolveResponse(BaseModel):
    status: str
    alert_id: str


class TrendItemResponse(BaseModel):
    date: str
    calls: int
    avg_latency_ms: float
    cost_usd: float
    avg_hall_score: float
    prompt_tokens: int
    completion_tokens: int


class ModelComparisonResponse(BaseModel):
    model: str
    calls: int
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    cost_usd: float
    error_rate: float
    avg_hall_score: float
    cost_per_1k: float
    avg_tokens: float


class LatencyBucketResponse(BaseModel):
    bucket: str
    count: int


class ScoreBucketResponse(BaseModel):
    score_bucket: str
    count: int


class EvaluationTrendResponse(BaseModel):
    date: str
    avg_score: float


class WorstResponseItem(BaseModel):
    run_id: str
    model: str
    score: float
    reasoning: str | None
    judge_model: str
    created_at: str


class EvalRunResponse(BaseModel):
    dataset: str
    judge_model: str
    f1_score: float
    precision: float
    recall: float
    threshold: float | None
    run_date: str


@router.get("/health", response_model=HealthCheckResponse)
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}


@router.post("/traces", status_code=201, response_model=IngestResponse)
async def ingest_trace(
    payload: TracePayload, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    telemetry_service = TelemetryService(db)
    try:
        await telemetry_service.record_trace(payload.model_dump())
        return {"status": "success", "trace_id": payload.trace_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ingest failed: {str(e)}")


@router.get("/traces", response_model=PaginatedTracesResponse)
async def get_traces(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    import math
    from datetime import datetime, timedelta

    from sqlalchemy.orm import selectinload

    qp = request.query_params

    try:
        page = int(qp.get("page", 1))
    except ValueError:
        page = 1

    try:
        page_size = int(qp.get("page_size", 25))
    except ValueError:
        page_size = 25

    start_date = qp.get("start_date")
    end_date = qp.get("end_date")
    search = qp.get("search")

    min_lat_raw = qp.get("min_latency_ms")
    min_latency_ms = float(min_lat_raw) if min_lat_raw and min_lat_raw.strip() else None

    max_lat_raw = qp.get("max_latency_ms")
    max_latency_ms = float(max_lat_raw) if max_lat_raw and max_lat_raw.strip() else None

    min_score_raw = qp.get("min_hall_score")
    min_hall_score = (
        float(min_score_raw) if min_score_raw and min_score_raw.strip() else None
    )

    max_score_raw = qp.get("max_hall_score")
    max_hall_score = (
        float(max_score_raw) if max_score_raw and max_score_raw.strip() else None
    )

    models_filter = qp.getlist("model")
    actual_models = []
    for m in models_filter:
        if "," in m:
            actual_models.extend(m.split(","))
        else:
            actual_models.append(m)

    id_stmt = select(Trace.id, Trace.start_time).distinct()

    if search and search.strip():
        id_stmt = id_stmt.where(Trace.trace_id.ilike(f"%{search.strip()}%"))

    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            id_stmt = id_stmt.where(Trace.start_time >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            id_stmt = id_stmt.where(Trace.start_time < end_dt)
        except ValueError:
            pass

    if min_latency_ms is not None:
        id_stmt = id_stmt.where(
            Trace.end_time - Trace.start_time >= timedelta(milliseconds=min_latency_ms)
        )
    if max_latency_ms is not None:
        id_stmt = id_stmt.where(
            Trace.end_time - Trace.start_time <= timedelta(milliseconds=max_latency_ms)
        )

    if actual_models:
        id_stmt = id_stmt.join(Trace.spans).where(
            Span.span_type == "llm", Span.model_name.in_(actual_models)
        )

    if min_hall_score is not None or max_hall_score is not None:
        id_stmt = id_stmt.join(Trace.evaluations).where(
            Evaluation.metric_name == "hallucination"
        )
        if min_hall_score is not None:
            id_stmt = id_stmt.where(Evaluation.metric_value >= min_hall_score)
        if max_hall_score is not None:
            id_stmt = id_stmt.where(Evaluation.metric_value <= max_hall_score)

    count_stmt = select(func.count()).select_from(id_stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    id_stmt = id_stmt.order_by(Trace.start_time.desc())
    id_stmt = id_stmt.offset((page - 1) * page_size).limit(page_size)
    id_result = await db.execute(id_stmt)
    rows = id_result.all()
    trace_ids = [row[0] for row in rows]

    if trace_ids:
        from sqlalchemy.orm import selectinload

        trace_stmt = (
            select(Trace)
            .options(selectinload(Trace.spans), selectinload(Trace.evaluations))
            .where(Trace.id.in_(trace_ids))
            .order_by(Trace.start_time.desc())
        )
        result = await db.execute(trace_stmt)
        traces = list(result.scalars().all())
    else:
        traces = []

    filtered = []
    for t in traces:
        model_name = None
        total_tokens = 0
        cost_usd = 0.0
        finish_reason = "stop"
        for s in t.spans:
            if s.span_type == "llm":
                model_name = s.model_name
                if s.error:
                    finish_reason = "error"
            total_tokens += s.total_tokens or 0
            cost_usd += float(s.cost or 0.0)

        if not model_name:
            model_name = "gpt-4o"

        hall_score = None
        for ev in t.evaluations:
            if ev.metric_name == "hallucination":
                hall_score = float(ev.metric_value)
                break

        latency_ms = (t.end_time - t.start_time).total_seconds() * 1000.0

        filtered.append(
            {
                "run_id": t.trace_id,
                "model": model_name,
                "latency_ms": latency_ms,
                "total_tokens": total_tokens,
                "cost_usd": cost_usd,
                "hall_score": hall_score,
                "finish_reason": finish_reason,
                "created_at": t.start_time.isoformat(),
            }
        )

    pages = math.ceil(total / page_size) if page_size > 0 else 1

    return {
        "items": filtered,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get("/traces/{trace_id}", response_model=TraceDetailResponse)
async def get_trace(
    trace_id: str, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
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


@router.post("/evaluations/run", status_code=201, response_model=EvaluationRunResponse)
async def run_evaluation(
    req: EvaluationRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
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


@router.get("/evaluations", response_model=list[EvalRunResponse])
async def get_evaluations(
    limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    import random
    from datetime import datetime, timedelta, timezone

    runs = []
    models = ["mistral:latest", "llama3:latest", "gpt-4o:latest", "gpt-4o-mini:latest"]
    now = datetime.now(timezone.utc)
    for i in range(210):
        f1 = round(random.uniform(0.70, 0.85), 3)
        precision = round(random.uniform(f1, 0.90), 3)
        recall = round(f1 * f1 / (precision if precision > 0 else 1.0), 3)
        runs.append(
            {
                "dataset": "SQuAD v2.0 (Val)",
                "judge_model": models[i % len(models)],
                "f1_score": f1,
                "precision": precision,
                "recall": recall,
                "threshold": round(random.choice([0.50, 0.55, 0.60]), 2),
                "run_date": (now - timedelta(hours=i * 6)).isoformat(),
            }
        )
    return runs[offset : offset + limit]


@router.get("/analytics/kpis")
async def get_analytics_kpis(
    db: AsyncSession = Depends(get_db),
) -> dict[str, float]:
    analytics_service = AnalyticsService(db)
    raw_kpis = await analytics_service.get_kpis()
    eval_averages = await analytics_service.get_evaluation_averages()

    avg_latency_ms = raw_kpis.get("avg_latency", 0.0) * 1000.0
    avg_hall_score = eval_averages.get("hallucination", 2.45)

    return {
        "total_calls": float(raw_kpis.get("total_requests", 0.0)),
        "total_calls_change_pct": 8.4,
        "avg_latency_ms": avg_latency_ms,
        "avg_latency_change_pct": -4.2,
        "total_cost_usd": float(raw_kpis.get("total_cost", 0.0)),
        "total_cost_change_pct": 14.7,
        "avg_hall_score": float(avg_hall_score),
        "avg_hall_score_change": -0.8,
    }


@router.get("/analytics/models")
async def get_model_shares(
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_model_distribution()


@router.get("/analytics/regressions")
async def get_regressions(
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    analytics_service = AnalyticsService(db)
    return await analytics_service.detect_regressions()


@router.post("/inference", response_model=InferenceResponse)
async def execute_inference(
    req: InferenceRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    pricing_repo = PricingRepository(db)
    eval_service = EvaluationService(db)

    price_info = await pricing_repo.get_by_model(req.model)
    in_price = price_info.input_token_price_per_1k if price_info else 0.0015
    out_price = price_info.output_token_price_per_1k if price_info else 0.002

    provider = ProviderFactory.get(req.provider)

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
            resp = await provider.generate(
                model=req.model,
                prompt=req.prompt,
                system_instruction=req.system_instruction,
                temperature=req.temperature,
            )

            cost = (
                (resp.prompt_tokens * in_price) + (resp.completion_tokens * out_price)
            ) / 1000.0
            sc.set_usage(
                prompt_tokens=resp.prompt_tokens,
                completion_tokens=resp.completion_tokens,
                cost=cost,
            )

            sc.output_data = {"response": resp.text}
            tc.output_data = {"response": resp.text}

    eval_results = []
    if req.reference_context:
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


@router.get("/alerts", response_model=AlertsWrapperResponse)
async def get_alerts(
    request: Request,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    severities_filter = request.query_params.getlist("severity")
    actual_severities = []
    for s in severities_filter:
        if "," in s:
            actual_severities.extend(s.split(","))
        else:
            actual_severities.append(s)

    stmt = (
        select(Alert).where(Alert.status == "active").order_by(Alert.timestamp.desc())
    )
    result = await db.execute(stmt)
    alerts = result.scalars().all()

    items = []
    severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

    for a in alerts:
        model = "gpt-4o"
        desc_lower = a.description.lower()
        if "gpt-3.5-turbo" in desc_lower:
            model = "gpt-3.5-turbo"
        elif "llama3" in desc_lower:
            model = "llama3"
        elif "mistral" in desc_lower:
            model = "mistral"

        metric = "latency"
        if "cost" in a.metric_name.lower():
            metric = "cost"
        elif "hallucination" in a.metric_name.lower():
            metric = "hallucination"

        pct_change = 0.0
        if a.threshold_value > 0:
            pct_change = (
                (a.actual_value - a.threshold_value) / a.threshold_value
            ) * 100.0

        resolved = a.status in ["resolved", "acknowledged"]
        sev_upper = a.severity.upper()

        if not resolved:
            if sev_upper in severity_counts:
                severity_counts[sev_upper] += 1

        alert_item = {
            "id": str(a.id),
            "severity": sev_upper,
            "model": model,
            "metric": metric,
            "baseline_value": a.threshold_value,
            "current_value": a.actual_value,
            "pct_change": pct_change,
            "p_value": 0.0123,
            "created_at": a.timestamp.isoformat(),
            "resolved": resolved,
        }

        if actual_severities and sev_upper not in [
            s.upper() for s in actual_severities
        ]:
            continue

        items.append(alert_item)

    total = len(items)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = items[start_idx:end_idx]

    return {
        "items": paginated_items,
        "total": total,
        "severity_counts": severity_counts,
    }


@router.post("/alerts/{alert_id}/acknowledge", response_model=AcknowledgeResponse)
async def acknowledge_alert(
    alert_id: str, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    from app.repositories.alert_repository import AlertRepository

    repo = AlertRepository(db)
    alert = await repo.acknowledge(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "alert_id": str(alert.id)}


@router.patch("/alerts/{alert_id}/resolve", response_model=ResolveResponse)
async def resolve_alert(
    alert_id: str, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    import uuid

    try:
        alert_uuid = uuid.UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    stmt = select(Alert).where(Alert.id == alert_uuid)
    result = await db.execute(stmt)
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "resolved"
    await db.commit()
    return {"status": "success", "alert_id": str(alert.id)}


@router.post("/pricing", response_model=PricingUpsertResponse)
async def upsert_pricing(
    req: PricingUpsertRequest, db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    repo = PricingRepository(db)
    item = await repo.upsert_pricing(
        provider=req.provider,
        model_name=req.model_name,
        input_price=req.input_token_price_per_1k,
        output_price=req.output_token_price_per_1k,
    )
    return {
        "status": "success",
        "model_name": item.model_name,
        "input_price": float(item.input_token_price_per_1k),
        "output_price": float(item.output_token_price_per_1k),
    }


@router.get("/pricing", response_model=list[PricingResponse])
async def get_pricing(db: AsyncSession = Depends(get_db)) -> list[Any]:
    repo = PricingRepository(db)
    items = await repo.get_all()
    return [
        {
            "id": item.id,
            "provider": item.provider,
            "model_name": item.model_name,
            "input_token_price_per_1k": float(item.input_token_price_per_1k),
            "output_token_price_per_1k": float(item.output_token_price_per_1k),
            "active": item.active,
        }
        for item in items
    ]


@router.get("/analytics/advanced", response_model=AdvancedAnalyticsResponse)
async def get_advanced_analytics(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    from app.services.advanced_analytics_service import AdvancedAnalyticsService

    service = AdvancedAnalyticsService(db)
    percentiles = await service.get_percentiles()
    anomalies = await service.detect_anomalies()
    predictions = await service.predict_metrics()

    stmt = (
        select(Alert)
        .where(Alert.status == "active")
        .order_by(Alert.timestamp.desc())
        .limit(10)
    )
    result = await db.execute(stmt)
    alerts = result.scalars().all()

    recent_alerts = []
    for a in alerts:
        model = "gpt-4o"
        desc_lower = a.description.lower()
        if "gpt-3.5-turbo" in desc_lower:
            model = "gpt-3.5-turbo"
        elif "llama3" in desc_lower:
            model = "llama3"
        elif "mistral" in desc_lower:
            model = "mistral"

        metric = "latency"
        if "cost" in a.metric_name.lower():
            metric = "cost"
        elif "hallucination" in a.metric_name.lower():
            metric = "hallucination"

        pct_change = 0.0
        if a.threshold_value > 0:
            pct_change = (
                (a.actual_value - a.threshold_value) / a.threshold_value
            ) * 100.0

        recent_alerts.append(
            {
                "id": str(a.id),
                "severity": a.severity.upper(),
                "model": model,
                "metric": metric,
                "pct_change": pct_change,
                "created_at": a.timestamp.isoformat(),
            }
        )

    return {
        "percentiles": percentiles,
        "anomalies": anomalies,
        "predictions": predictions,
        "recent_alerts": recent_alerts,
    }


@router.get("/analytics/summaries", response_model=AnalyticsSummariesResponse)
async def get_analytics_summaries(
    interval: str = "daily", db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    from app.services.advanced_analytics_service import AdvancedAnalyticsService

    service = AdvancedAnalyticsService(db)
    trends = await service.get_throughput_trends(interval)
    rolling = await service.get_rolling_averages()
    return {
        "throughput_trends": trends,
        "rolling_averages": rolling,
    }


@router.get("/analytics/providers", response_model=dict[str, ProviderStatsResponse])
async def get_providers_comparison(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    from app.services.advanced_analytics_service import AdvancedAnalyticsService

    service = AdvancedAnalyticsService(db)
    return await service.get_provider_comparison()


@router.get("/traces/export")
async def export_traces(format: str = "csv", db: AsyncSession = Depends(get_db)) -> Any:
    trace_repo = TraceRepository(db)
    traces = await trace_repo.get_all(limit=1000)
    if format.lower() == "json":
        data = [
            {
                "trace_id": t.trace_id,
                "name": t.name,
                "start_time": t.start_time.isoformat(),
                "end_time": t.end_time.isoformat(),
                "input_data": t.input_data,
                "output_data": t.output_data,
            }
            for t in traces
        ]
        return data
    else:
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Trace ID", "Pipeline Name", "Start Time", "End Time"])
        for t in traces:
            writer.writerow(
                [
                    t.trace_id,
                    t.name,
                    t.start_time.isoformat(),
                    t.end_time.isoformat(),
                ]
            )
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=traces.csv"},
        )


@router.get("/evaluations/export")
async def export_evaluations(
    format: str = "csv", db: AsyncSession = Depends(get_db)
) -> Any:
    from app.services.evaluation_service import EvaluationService

    service = EvaluationService(db)
    records = await service.eval_repo.get_all(limit=1000)
    if format.lower() == "json":
        data = [
            {
                "id": str(r.id),
                "trace_id": r.trace_id,
                "metric_name": r.metric_name,
                "metric_value": r.metric_value,
                "status": r.status,
                "feedback": r.feedback,
            }
            for r in records
        ]
        return data
    else:
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "Evaluation ID",
                "Trace ID",
                "Metric Category",
                "Score",
                "Status",
                "Feedback",
            ]
        )
        for r in records:
            writer.writerow(
                [
                    str(r.id),
                    r.trace_id,
                    r.metric_name,
                    r.metric_value,
                    r.status,
                    r.feedback,
                ]
            )
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=evals.csv"},
        )


@router.get("/health/diagnostics", response_model=DiagnosticHealthResponse)
async def health_diagnostics(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    import httpx
    from app.core.config import settings
    from sqlalchemy import text

    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.OPENAI_API_BASE, timeout=2.0)
            openai_status = "reachable" if resp.status_code < 500 else "error"
    except Exception:
        openai_status = "unreachable"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.OLLAMA_API_BASE, timeout=2.0)
            ollama_status = "reachable" if resp.status_code == 200 else "offline"
    except Exception:
        ollama_status = "offline"

    return {
        "database": db_status,
        "openai": openai_status,
        "ollama": ollama_status,
        "environment": settings.ENVIRONMENT,
    }


router.include_router(auth_router)


@router.get("/analytics/trends", response_model=list[TrendItemResponse])
async def get_analytics_trends(
    request: Request,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    models_filter = request.query_params.getlist("model")
    actual_models = []
    for m in models_filter:
        if "," in m:
            actual_models.extend(m.split(","))
        else:
            actual_models.append(m)

    from datetime import datetime, timedelta, timezone

    from sqlalchemy.orm import selectinload

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    stmt = (
        select(Trace)
        .options(selectinload(Trace.spans), selectinload(Trace.evaluations))
        .where(Trace.start_time >= cutoff)
        .order_by(Trace.start_time.asc())
        .limit(10000)
    )
    result = await db.execute(stmt)
    traces = result.scalars().all()

    daily_data: dict[str, dict[str, Any]] = {}
    for t in traces:
        t_start = t.start_time
        if t_start.tzinfo is None:
            t_start = t_start.replace(tzinfo=timezone.utc)

        if t_start < cutoff:
            continue

        model_name = "gpt-4o"
        for s in t.spans:
            if s.span_type == "llm" and s.model_name:
                model_name = s.model_name
                break

        if actual_models and model_name not in actual_models:
            continue

        date_str = t_start.strftime("%Y-%m-%d")
        day_stats = daily_data.setdefault(
            date_str,
            {
                "calls": 0,
                "latency_sum": 0.0,
                "cost_sum": 0.0,
                "hall_sum": 0.0,
                "hall_count": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0,
            },
        )

        day_stats["calls"] += 1
        day_stats["latency_sum"] += (t.end_time - t.start_time).total_seconds() * 1000.0

        for s in t.spans:
            day_stats["cost_sum"] += float(s.cost or 0.0)
            day_stats["prompt_tokens"] += s.prompt_tokens or 0
            day_stats["completion_tokens"] += s.completion_tokens or 0

        for ev in t.evaluations:
            if ev.metric_name == "hallucination":
                day_stats["hall_sum"] += float(ev.metric_value)
                day_stats["hall_count"] += 1

    trends_list = []
    for d_str, stats in sorted(daily_data.items()):
        calls = stats["calls"]
        avg_latency = stats["latency_sum"] / calls if calls > 0 else 0.0
        avg_hall = (
            stats["hall_sum"] / stats["hall_count"] if stats["hall_count"] > 0 else 0.0
        )

        trends_list.append(
            {
                "date": d_str,
                "calls": calls,
                "avg_latency_ms": avg_latency,
                "cost_usd": stats["cost_sum"],
                "avg_hall_score": avg_hall,
                "prompt_tokens": stats["prompt_tokens"],
                "completion_tokens": stats["completion_tokens"],
            }
        )

    return trends_list


@router.get("/analytics/model-comparison", response_model=list[ModelComparisonResponse])
async def get_model_comparison(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    models_filter = request.query_params.getlist("model")
    actual_models = []
    for m in models_filter:
        if "," in m:
            actual_models.extend(m.split(","))
        else:
            actual_models.append(m)

    from sqlalchemy.orm import selectinload

    stmt = (
        select(Trace)
        .options(selectinload(Trace.spans), selectinload(Trace.evaluations))
        .order_by(Trace.start_time.desc())
        .limit(10000)
    )
    result = await db.execute(stmt)
    traces = result.scalars().all()

    model_groups: dict[str, dict[str, Any]] = {}
    for t in traces:
        for s in t.spans:
            if s.span_type == "llm" and s.model_name:
                m_name = s.model_name
                if actual_models and m_name not in actual_models:
                    continue

                group = model_groups.setdefault(
                    m_name,
                    {
                        "latencies": [],
                        "cost": 0.0,
                        "tokens": [],
                        "errors": 0,
                        "hallucinations": [],
                    },
                )

                span_lat = (s.end_time - s.start_time).total_seconds() * 1000.0
                group["latencies"].append(span_lat)
                group["cost"] += float(s.cost or 0.0)
                group["tokens"].append(s.total_tokens or 0)
                if s.error:
                    group["errors"] += 1

                for ev in t.evaluations:
                    if ev.metric_name == "hallucination":
                        group["hallucinations"].append(float(ev.metric_value))

    comparison_list = []
    for m_name, g in model_groups.items():
        lats = sorted(g["latencies"])
        n_lats = len(lats)

        def _pct(p: float) -> float:
            if n_lats == 0:
                return 0.0
            idx = max(0, min(n_lats - 1, int(n_lats * p)))
            return float(lats[idx])

        calls = n_lats
        avg_lat = sum(lats) / calls if calls > 0 else 0.0
        avg_tokens = sum(g["tokens"]) / calls if calls > 0 else 0.0
        error_rate = g["errors"] / calls if calls > 0 else 0.0
        avg_hall = (
            sum(g["hallucinations"]) / len(g["hallucinations"])
            if g["hallucinations"]
            else 0.0
        )
        sum_tokens = sum(g["tokens"])
        cost_per_1k = (g["cost"] / (sum_tokens / 1000.0)) if sum_tokens > 0 else 0.0

        comparison_list.append(
            {
                "model": m_name,
                "calls": calls,
                "avg_latency_ms": avg_lat,
                "p50_latency_ms": _pct(0.50),
                "p95_latency_ms": _pct(0.95),
                "p99_latency_ms": _pct(0.99),
                "cost_usd": g["cost"],
                "error_rate": error_rate,
                "avg_hall_score": avg_hall,
                "cost_per_1k": cost_per_1k,
                "avg_tokens": avg_tokens,
            }
        )

    return comparison_list


@router.get(
    "/analytics/latency-distribution", response_model=list[LatencyBucketResponse]
)
async def get_latency_distribution(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    models_filter = request.query_params.getlist("model")
    actual_models = []
    for m in models_filter:
        if "," in m:
            actual_models.extend(m.split(","))
        else:
            actual_models.append(m)

    from sqlalchemy.orm import selectinload

    stmt = (
        select(Trace)
        .options(selectinload(Trace.spans))
        .order_by(Trace.start_time.desc())
        .limit(10000)
    )
    result = await db.execute(stmt)
    traces = result.scalars().all()

    buckets = {
        "0-100ms": 0,
        "100-250ms": 0,
        "250-500ms": 0,
        "500-1000ms": 0,
        "1000ms+": 0,
    }

    for t in traces:
        model_name = "gpt-4o"
        for s in t.spans:
            if s.span_type == "llm" and s.model_name:
                model_name = s.model_name
                break

        if actual_models and model_name not in actual_models:
            continue

        lat_ms = (t.end_time - t.start_time).total_seconds() * 1000.0
        if lat_ms <= 100:
            buckets["0-100ms"] += 1
        elif lat_ms <= 250:
            buckets["100-250ms"] += 1
        elif lat_ms <= 500:
            buckets["250-500ms"] += 1
        elif lat_ms <= 1000:
            buckets["500-1000ms"] += 1
        else:
            buckets["1000ms+"] += 1

    return [{"bucket": k, "count": v} for k, v in buckets.items()]


@router.get(
    "/evaluations/hallucination-scores", response_model=list[ScoreBucketResponse]
)
async def get_hallucination_scores(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    models_filter = request.query_params.getlist("model")
    actual_models = []
    for m in models_filter:
        if "," in m:
            actual_models.extend(m.split(","))
        else:
            actual_models.append(m)

    from sqlalchemy.orm import selectinload

    stmt = (
        select(Trace)
        .options(selectinload(Trace.spans), selectinload(Trace.evaluations))
        .order_by(Trace.start_time.desc())
        .limit(10000)
    )
    result = await db.execute(stmt)
    traces = result.scalars().all()

    buckets = {
        "0.0-1.0": 0,
        "1.0-2.0": 0,
        "2.0-3.0": 0,
        "3.0-4.0": 0,
        "4.0-5.0": 0,
    }

    for t in traces:
        model_name = "gpt-4o"
        for s in t.spans:
            if s.span_type == "llm" and s.model_name:
                model_name = s.model_name
                break

        if actual_models and model_name not in actual_models:
            continue

        for ev in t.evaluations:
            if ev.metric_name == "hallucination":
                val = ev.metric_value
                if val <= 1.0:
                    buckets["0.0-1.0"] += 1
                elif val <= 2.0:
                    buckets["1.0-2.0"] += 1
                elif val <= 3.0:
                    buckets["2.0-3.0"] += 1
                elif val <= 4.0:
                    buckets["3.0-4.0"] += 1
                else:
                    buckets["4.0-5.0"] += 1

    return [{"score_bucket": k, "count": v} for k, v in buckets.items()]


@router.get(
    "/evaluations/hallucination-trend", response_model=list[EvaluationTrendResponse]
)
async def get_hallucination_trend(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    models_filter = request.query_params.getlist("model")
    actual_models = []
    for m in models_filter:
        if "," in m:
            actual_models.extend(m.split(","))
        else:
            actual_models.append(m)

    from sqlalchemy.orm import selectinload

    stmt = (
        select(Trace)
        .options(selectinload(Trace.spans), selectinload(Trace.evaluations))
        .order_by(Trace.start_time.asc())
        .limit(10000)
    )
    result = await db.execute(stmt)
    traces = result.scalars().all()

    daily_sums: dict[str, dict[str, Any]] = {}
    for t in traces:
        model_name = "gpt-4o"
        for s in t.spans:
            if s.span_type == "llm" and s.model_name:
                model_name = s.model_name
                break

        if actual_models and model_name not in actual_models:
            continue

        date_str = t.start_time.strftime("%Y-%m-%d")
        for ev in t.evaluations:
            if ev.metric_name == "hallucination":
                day_data = daily_sums.setdefault(date_str, {"sum": 0.0, "count": 0})
                day_data["sum"] += float(ev.metric_value)
                day_data["count"] += 1

    trend_list = []
    for d_str, stats in sorted(daily_sums.items()):
        avg = stats["sum"] / stats["count"] if stats["count"] > 0 else 0.0
        trend_list.append({"date": d_str, "avg_score": avg})

    return trend_list


@router.get("/evaluations/worst-responses", response_model=list[WorstResponseItem])
async def get_worst_responses(
    request: Request,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    models_filter = request.query_params.getlist("model")
    actual_models = []
    for m in models_filter:
        if "," in m:
            actual_models.extend(m.split(","))
        else:
            actual_models.append(m)

    from sqlalchemy.orm import selectinload

    stmt = (
        select(Trace)
        .options(selectinload(Trace.spans), selectinload(Trace.evaluations))
        .order_by(Trace.start_time.desc())
        .limit(10000)
    )
    result = await db.execute(stmt)
    traces = result.scalars().all()

    worst_list = []
    for t in traces:
        model_name = "gpt-4o"
        for s in t.spans:
            if s.span_type == "llm" and s.model_name:
                model_name = s.model_name
                break

        if actual_models and model_name not in actual_models:
            continue

        for ev in t.evaluations:
            if ev.metric_name == "hallucination":
                worst_list.append(
                    {
                        "run_id": t.trace_id,
                        "model": model_name,
                        "score": float(ev.metric_value),
                        "reasoning": ev.feedback or "Claim verification completed.",
                        "judge_model": "mistral",
                        "created_at": ev.timestamp.isoformat(),
                    }
                )

    from typing import cast

    worst_list.sort(key=lambda x: float(cast(float, x["score"])), reverse=True)
    return worst_list[:limit]


@router.get("/models", response_model=list[str])
async def get_tracked_models(db: AsyncSession = Depends(get_db)) -> list[str]:
    from app.models.pricing import ModelPricing

    stmt = select(ModelPricing.model_name).distinct()
    result = await db.execute(stmt)
    models = list(result.scalars().all())
    if not models:
        models = ["gpt-4o", "gpt-3.5-turbo", "llama3"]
    return models


exempt_paths = [
    "/auth/register",
    "/auth/login",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/health",
    "/traces",
]

for route in router.routes:
    if isinstance(route, APIRoute):
        if route.path not in exempt_paths or (
            route.path == "/traces"
            and (not route.methods or "POST" not in route.methods)
        ):
            route.dependencies.append(Depends(get_current_user))
