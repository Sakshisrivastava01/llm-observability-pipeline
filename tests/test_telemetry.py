import pytest
from app.models.trace import Trace
from app.repositories.trace_repository import TraceRepository
from sqlalchemy import select


@pytest.mark.anyio
async def test_trace_and_span_creation(db_session) -> None:
    """Verifies that traces and nested spans are successfully persisted to the database."""
    repo = TraceRepository(db_session)
    payload = {
        "trace_id": "tr-test-99",
        "name": "test_inference_pipeline",
        "start_time": "2026-06-28T00:00:00Z",
        "end_time": "2026-06-28T00:00:02Z",
        "input_data": {"prompt": "Hello"},
        "output_data": {"response": "World"},
        "spans": [
            {
                "span_id": "sp-test-99",
                "name": "model_inference",
                "span_type": "llm",
                "start_time": "2026-06-28T00:00:00Z",
                "end_time": "2026-06-28T00:00:02Z",
                "model_name": "gpt-3.5-turbo",
                "prompt_tokens": 10,
                "completion_tokens": 8,
                "total_tokens": 18,
                "cost": 0.0001,
            }
        ],
    }

    trace = await repo.create(payload)
    assert trace.trace_id == "tr-test-99"

    # Query to verify in-memory persistence
    from sqlalchemy.orm import selectinload

    stmt = (
        select(Trace)
        .options(selectinload(Trace.spans))
        .where(Trace.trace_id == "tr-test-99")
    )
    result = await db_session.execute(stmt)
    saved_trace = result.scalars().first()

    assert saved_trace is not None
    assert len(saved_trace.spans) == 1
    assert saved_trace.spans[0].span_id == "sp-test-99"
    assert saved_trace.spans[0].cost == 0.0001
