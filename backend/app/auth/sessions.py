"""Opaque cookies, bounded lifetime, and CSRF tokens for unsafe requests."""

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Response
from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..config import settings
from ..models import AuthSession

COOKIE_NAME = "nfl_session"


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def csrf_token(token: str) -> str:
    return hmac.new(token.encode(), b"nfl-csrf-v1", hashlib.sha256).hexdigest()


def create_session(session: Session, user_id: int, previous_token: str | None) -> str:
    now = utc_now()
    session.execute(delete(AuthSession).where(AuthSession.expires_at <= now))
    if previous_token:
        session.execute(
            delete(AuthSession).where(AuthSession.token_hash == token_digest(previous_token))
        )
    token = secrets.token_urlsafe(32)
    session.add(
        AuthSession(
            token_hash=token_digest(token),
            user_id=user_id,
            expires_at=now + timedelta(hours=settings.session_hours),
        )
    )
    return token


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=settings.session_hours * 3600,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        COOKIE_NAME, path="/", httponly=True, secure=settings.session_cookie_secure, samesite="lax"
    )
