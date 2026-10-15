"""Development-only, request-scoped SQL traces; no SQL execution endpoint."""

import time
from collections import OrderedDict
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from threading import Lock
from typing import Any

from sqlalchemy import event

MAX_REQUESTS = 100
MAX_STATEMENTS = 100


@dataclass
class SQLTrace:
    request_id: str
    method: str
    path: str
    statements: list[dict[str, Any]] = field(default_factory=list)
    truncated: bool = False


active_trace: ContextVar[SQLTrace | None] = ContextVar("active_sql_trace", default=None)
_traces: OrderedDict[str, SQLTrace] = OrderedDict()
_trace_lock = Lock()


def json_parameter(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, dict):
        return {str(key): json_parameter(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_parameter(item) for item in value]
    return f"<{type(value).__name__}>"


def save_trace(trace: SQLTrace) -> None:
    with _trace_lock:
        _traces[trace.request_id] = trace
        while len(_traces) > MAX_REQUESTS:
            _traces.popitem(last=False)


def get_trace(request_id: str) -> SQLTrace | None:
    with _trace_lock:
        return _traces.get(request_id)


def install_sql_capture(engine) -> None:
    @event.listens_for(engine, "before_cursor_execute")
    def before_execute(_conn, _cursor, statement, parameters, context, _executemany):
        trace = active_trace.get()
        if trace is None:
            return
        if len(trace.statements) >= MAX_STATEMENTS:
            trace.truncated = True
            return
        entry = {
            "statement": statement,
            "parameters": json_parameter(parameters),
            "duration_ms": None,
        }
        trace.statements.append(entry)
        context._prototype_debug_entry = (entry, time.perf_counter())

    def complete(context):
        entry_data = getattr(context, "_prototype_debug_entry", None)
        if entry_data:
            entry, started = entry_data
            entry["duration_ms"] = round((time.perf_counter() - started) * 1000, 3)

    @event.listens_for(engine, "after_cursor_execute")
    def after_execute(_conn, _cursor, _statement, _parameters, context, _executemany):
        complete(context)

    @event.listens_for(engine, "handle_error")
    def failed_execute(exception_context):
        if exception_context.execution_context is not None:
            complete(exception_context.execution_context)
