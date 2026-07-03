from contextvars import ContextVar
from typing import Any

_active_trace: ContextVar[dict[str, Any] | None] = ContextVar(
    "active_trace", default=None
)
_active_spans: ContextVar[list[dict[str, Any]]] = ContextVar("active_spans", default=[])


class TelemetrySDK:
    @staticmethod
    def get_active_trace() -> dict[str, Any] | None:
        return _active_trace.get()

    @staticmethod
    def set_active_trace(trace: dict[str, Any] | None) -> None:
        _active_trace.set(trace)

    @staticmethod
    def get_active_spans() -> list[dict[str, Any]]:
        return _active_spans.get()

    @staticmethod
    def add_active_span(span: dict[str, Any]) -> None:
        spans = list(_active_spans.get())
        spans.append(span)
        _active_spans.set(spans)

    @staticmethod
    def remove_active_span(span_id: str) -> None:
        spans = [s for s in _active_spans.get() if s["span_id"] != span_id]
        _active_spans.set(spans)

    @staticmethod
    def clear_context() -> None:
        _active_trace.set(None)
        _active_spans.set([])
