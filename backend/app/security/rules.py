"""Small, explicit SQL probe signatures, not a general SQL parser or sanitizer."""

import json
import re
from urllib.parse import unquote_plus

_SQL_PROBES = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"\bunion\s+(?:all\s+)?select\b",
        r";\s*(?:drop|alter|truncate|delete|insert|update)\s+\w",
        r"['\"]\s*(?:or|and)\s+['\"\d][^\r\n]{0,60}(?:=|\blike\b)",
        r"\b(?:sleep|benchmark|pg_sleep)\s*\(",
        r"\bwaitfor\s+delay\b",
        r"\b(?:xp_cmdshell|load_file)\s*\(?",
    )
]


def looks_like_sql_probe(value: str) -> bool:
    # Inspect common URL encodings and comment-separated keywords, without
    # rewriting the value that the API later passes as a bound parameter.
    for _ in range(2):
        value = unquote_plus(value)
    # Scan comments once. A backtracking wildcard over many unclosed comments
    # could itself turn an abusive request into excessive CPU work.
    parts = []
    cursor = 0
    while True:
        start = value.find("/*", cursor)
        end = value.find("*/", start + 2) if start >= 0 else -1
        if end < 0:
            parts.append(value[cursor:])
            break
        parts.extend((value[cursor:start], " "))
        cursor = end + 2
    value = "".join(parts)
    return any(rule.search(value) for rule in _SQL_PROBES)


def body_has_sql_probe(body: bytes, *, account_request: bool) -> bool:
    if not body:
        return False
    try:
        data = json.loads(body)
    except (ValueError, UnicodeError, RecursionError):
        # Pydantic/FastAPI handles invalid JSON with its normal readable error.
        return False
    pending = [data]
    while pending:
        value = pending.pop()
        if isinstance(value, dict):
            pending.extend(
                item for key, item in value.items() if not (account_request and key == "password")
            )
        elif isinstance(value, list):
            pending.extend(value)
        elif isinstance(value, str) and looks_like_sql_probe(value):
            return True
    return False
