"""Read the current role for every request; never trust a client-supplied role."""

import secrets
from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Header, Request
from fastapi.security import APIKeyCookie
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..errors import AppError
from ..models import AuthSession, User
from .database import AuthSessionLocal
from .sessions import COOKIE_NAME, csrf_token, token_digest, utc_now

session_cookie = APIKeyCookie(name=COOKIE_NAME, auto_error=False)
CookieToken = Annotated[str | None, Depends(session_cookie)]


def get_account_session() -> Iterator[Session]:
    with AuthSessionLocal() as session:
        yield session


AccountDB = Annotated[Session, Depends(get_account_session)]


def check_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    allowed = {str(request.base_url).rstrip("/"), *settings.cors_origins}
    if origin and origin not in allowed:
        raise AppError(
            403, "untrusted_origin", "Open this app in its own browser tab and try again."
        )


def require_json_origin(request: Request) -> None:
    check_origin(request)
    if (
        request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
        != "application/json"
    ):
        raise AppError(415, "json_required", "Send account details as JSON.")


def current_user(token: CookieToken) -> User | None:
    if not token or len(token) > 128:
        return None
    with AuthSessionLocal() as session:
        return session.scalar(
            select(User)
            .join(AuthSession, AuthSession.user_id == User.user_id)
            .where(
                AuthSession.token_hash == token_digest(token),
                AuthSession.expires_at > utc_now(),
            )
        )


def require_user(
    request: Request,
    token: CookieToken,
    user: Annotated[User | None, Depends(current_user)],
    x_csrf_token: Annotated[
        str | None, Header(description="For writes, copy csrf_token from /api/auth/me or login.")
    ] = None,
) -> User:
    if user is None or token is None:
        raise AppError(
            401, "sign_in_required", "Please sign in to continue. Your session may have expired."
        )
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        check_origin(request)
        if not x_csrf_token or not secrets.compare_digest(
            x_csrf_token.encode(), csrf_token(token).encode()
        ):
            raise AppError(
                403, "csrf_failed", "Refresh this page before saving changes, then try again."
            )
    return user


def require_admin(user: Annotated[User, Depends(require_user)]) -> User:
    if user.role != "admin":
        raise AppError(
            403, "admin_required", "Only an administrator can change shared sports records."
        )
    return user


def require_debug_admin(
    request: Request,
    token: CookieToken,
) -> User:
    if not settings.debug_ui_enabled:
        raise AppError(404, "not_found", "SQL inspection is not enabled.")
    return require_admin(require_user(request, token, current_user(token)))


SignedInUser = Annotated[User, Depends(require_user)]
