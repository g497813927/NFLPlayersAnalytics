"""Small per-process account-attempt limiter for the local prototype."""

from collections import OrderedDict
from threading import Lock
from time import monotonic

from fastapi import Request

from ..errors import AppError

_attempts: OrderedDict[str, list[float]] = OrderedDict()
_lock = Lock()


def limit_account_attempts(request: Request) -> None:
    # Do not trust client-controlled X-Forwarded-For here.
    key = request.client.host if request.client else "unknown"
    now = monotonic()
    with _lock:
        recent = [stamp for stamp in _attempts.pop(key, []) if stamp > now - 60]
        _attempts[key] = recent
        if len(_attempts) > 1000:
            _attempts.popitem(last=False)
        if len(recent) >= 10:
            raise AppError(
                429, "too_many_attempts", "Too many sign-in attempts. Wait a minute and try again."
            )
        recent.append(now)
