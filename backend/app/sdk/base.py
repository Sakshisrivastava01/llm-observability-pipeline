from contextvars import ContextVar
from typing import Any

# Context variables mapping to ensure zero thread crossover risk
_active_trace: ContextVar[dict[str, Any] | None] = ContextVar(
    "active_trace", default=None
)
_active_spans: ContextVar[list[dict[str, Any]]] = ContextVar("active_spans", default=[])


class TelemetrySDK:
    """Thread-safe context registrar and static accessor helper for tracking active spans and traces."""

    @staticmethod
    def get_active_trace() -> dict[str, Any] | None:
        """Retrieves the active trace context from the local thread context."""
        return _active_trace.get()

    @staticmethod
    def set_active_trace(trace: dict[str, Any] | None) -> None:
        """Sets the active trace context in the local thread context."""
        _active_trace.set(trace)

    @staticmethod
    def get_active_spans() -> list[dict[str, Any]]:
        """Retrieves all active spans tracked inside the current trace context."""
        return _active_spans.get()

    @staticmethod
    def add_active_span(span: dict[str, Any]) -> None:
        """Adds a span to the thread-local active span collection."""
        spans = list(_active_spans.get())
        spans.append(span)
        _active_spans.set(spans)

    @staticmethod
    def remove_active_span(span_id: str) -> None:
        """Removes a specific span from the active collection."""
        spans = [s for s in _active_spans.get() if s["span_id"] != span_id]
        _active_spans.set(spans)

    @staticmethod
    def clear_context() -> None:
        """Flushes all thread-local trace and span context variables."""
        _active_trace.set(None)
        _active_spans.set([])
