import uuid
from datetime import datetime, timezone
from typing import Any

from app.sdk.base import TelemetrySDK
from app.sdk.collector import TelemetryCollector


class TraceContext:
    """Async context manager for logging execution traces."""

    def __init__(
        self,
        name: str,
        input_data: dict[str, Any] | None = None,
        custom_metadata: dict[str, Any] | None = None,
    ):
        self.name = name
        self.input_data = input_data or {}
        self.custom_metadata = custom_metadata or {}
        self.trace_id = f"tr-{uuid.uuid4()}"
        self.start_time: datetime | None = None
        self.end_time: datetime | None = None
        self.output_data: dict[str, Any] = {}

    async def __aenter__(self) -> "TraceContext":
        self.start_time = datetime.now(timezone.utc)
        trace_info = {
            "trace_id": self.trace_id,
            "name": self.name,
            "start_time": self.start_time.isoformat(),
            "input_data": self.input_data,
            "custom_metadata": self.custom_metadata,
        }
        TelemetrySDK.set_active_trace(trace_info)
        TelemetrySDK.get_active_spans().clear()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.end_time = datetime.now(timezone.utc)
        trace_info = TelemetrySDK.get_active_trace()
        if not trace_info:
            return

        spans = list(TelemetrySDK.get_active_spans())

        if exc_type:
            self.output_data["error"] = str(exc_val)

        payload = {
            "trace_id": self.trace_id,
            "name": self.name,
            "start_time": self.start_time.isoformat() if self.start_time else "",
            "end_time": self.end_time.isoformat() if self.end_time else "",
            "input_data": self.input_data,
            "output_data": self.output_data,
            "custom_metadata": self.custom_metadata,
            "spans": spans,
        }

        # Transmit telemetry asynchronously to endpoint
        await TelemetryCollector.submit_trace(payload)
        TelemetrySDK.clear_context()


class SpanContext:
    """Async context manager for logging child execution spans (e.g. LLM call steps)."""

    def __init__(
        self,
        name: str,
        span_type: str = "llm",
        parent_span_id: str | None = None,
        input_data: dict[str, Any] | None = None,
        model_name: str | None = None,
        custom_metadata: dict[str, Any] | None = None,
    ):
        self.name = name
        self.span_type = span_type
        self.parent_span_id = parent_span_id
        self.input_data = input_data or {}
        self.model_name = model_name
        self.custom_metadata = custom_metadata or {}
        self.span_id = f"sp-{uuid.uuid4()}"
        self.start_time: datetime | None = None
        self.end_time: datetime | None = None
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.total_tokens = 0
        self.cost = 0.0
        self.output_data: dict[str, Any] = {}

    def set_usage(
        self, prompt_tokens: int, completion_tokens: int, cost: float = 0.0
    ) -> None:
        """Sets prompt token usage, completion token usage, and calculated cost metrics."""
        self.prompt_tokens = prompt_tokens
        self.completion_tokens = completion_tokens
        self.total_tokens = prompt_tokens + completion_tokens
        self.cost = cost

    async def __aenter__(self) -> "SpanContext":
        self.start_time = datetime.now(timezone.utc)
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.end_time = datetime.now(timezone.utc)
        trace_info = TelemetrySDK.get_active_trace()
        if not trace_info:
            return

        output_data = dict(self.output_data)
        error_msg = None
        if exc_type:
            error_msg = str(exc_val)
            output_data["error"] = error_msg

        span_info = {
            "span_id": self.span_id,
            "trace_id": trace_info["trace_id"],
            "parent_span_id": self.parent_span_id,
            "name": self.name,
            "span_type": self.span_type,
            "start_time": self.start_time.isoformat() if self.start_time else "",
            "end_time": self.end_time.isoformat() if self.end_time else "",
            "input_data": self.input_data,
            "output_data": output_data,
            "model_name": self.model_name,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "cost": self.cost,
            "error": error_msg,
            "custom_metadata": self.custom_metadata,
        }

        TelemetrySDK.add_active_span(span_info)
