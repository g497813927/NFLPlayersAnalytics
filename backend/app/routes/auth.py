"""Register, sign in, restore a session, and revoke the current session."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError

from ..api_docs import WRITE_RESPONSES, documented_error
from ..auth.database import AuthSessionLocal
from ..auth.dependencies import CookieToken, SignedInUser, current_user, require_json_origin
from ..auth.passwords import password_hasher, verify_password
from ..auth.sessions import (
    clear_session_cookie,
    create_session,
    csrf_token,
    set_session_cookie,
    token_digest,
)
from ..auth.throttle import limit_account_attempts
from ..errors import AppError
from ..models import AuthSession, User, UserCredential
from ..schemas.account_response import AccountResponse
from ..schemas.account_user import AccountUser
from ..schemas.login_request import LoginRequest
from ..schemas.register_request import RegisterRequest

router = APIRouter(
    prefix="/auth",
    tags=["Accounts"],
    responses={
        **WRITE_RESPONSES,
        415: documented_error(
            "Account requests must use application/json.",
            "json_required",
            "Send account details as JSON.",
        ),
        429: documented_error(
            "Wait before trying more account requests.",
            "too_many_attempts",
            "Too many account attempts. Wait a minute and try again.",
        ),
    },
)
account_dependencies = [Depends(require_json_origin), Depends(limit_account_attempts)]


def account_result(user: User, token: str) -> AccountResponse:
    return AccountResponse(user=AccountUser.model_validate(user), csrf_token=csrf_token(token))


@router.post(
    "/register",
    status_code=201,
    response_model=AccountResponse,
    dependencies=account_dependencies,
    summary="Create a normal account",
    description="Register with email, display_name, and a password of 12–128 characters. "
    "Always creates a fan (normal user); role fields are rejected. A new HttpOnly session cookie "
    "is set. Seeded demo users cannot be claimed. Use synthetic account details for this demo.",
)
def register(payload: RegisterRequest, response: Response, token: CookieToken):
    with AuthSessionLocal.begin() as session:
        if session.scalar(select(User.user_id).where(func.lower(User.email) == payload.email)):
            raise AppError(
                409,
                "email_unavailable",
                "This email is already registered. Sign in or use another email.",
            )
        user = User(email=payload.email, display_name=payload.display_name, role="fan")
        session.add(user)
        try:
            session.flush()
        except IntegrityError:
            raise AppError(
                409,
                "email_unavailable",
                "This email is already registered. Sign in or use another email.",
            ) from None
        session.add(
            UserCredential(
                user_id=user.user_id, password_hash=password_hasher.hash(payload.password)
            )
        )
        session.flush()
        new_token = create_session(session, user.user_id, token)
        result = account_result(user, new_token)
    set_session_cookie(response, new_token)
    return result


@router.post(
    "/login",
    response_model=AccountResponse,
    dependencies=account_dependencies,
    summary="Sign in with email and password",
    description="Sets an HttpOnly session cookie and returns csrf_token. For subsequent writes, "
    "send that value in X-CSRF-Token. Swagger shares this cookie on the same origin. "
    "The password is never returned or included in SQL traces. Ten account attempts per minute "
    "are allowed per client IP in each server process (429 if exceeded).",
)
def login(payload: LoginRequest, response: Response, token: CookieToken):
    with AuthSessionLocal.begin() as session:
        record = session.execute(
            select(User, UserCredential)
            .join(UserCredential)
            .where(func.lower(User.email) == payload.email)
        ).first()
        if not verify_password(payload.password, record[1].password_hash if record else None):
            raise AppError(401, "invalid_credentials", "The email or password is incorrect.")
        user = record[0]
        verified_hash = record[1].password_hash
        # A conditional no-op write rechecks the hash and locks it through session
        # creation, including on SQLite where SELECT FOR UPDATE has no effect.
        locked = session.execute(
            update(UserCredential)
            .where(
                UserCredential.user_id == user.user_id,
                UserCredential.password_hash == verified_hash,
            )
            .values(password_hash=verified_hash)
        )
        if locked.rowcount != 1:
            raise AppError(401, "invalid_credentials", "The email or password is incorrect.")
        new_token = create_session(session, user.user_id, token)
        result = account_result(user, new_token)
    set_session_cookie(response, new_token)
    return result


@router.get(
    "/me",
    response_model=AccountResponse,
    summary="Restore the current account",
    description="Returns the current user and CSRF token, or null fields when signed out or expired. "
    "This does not extend the session lifetime. Read the current role here; do not infer it from UI state.",
)
def me(token: CookieToken, user: Annotated[User | None, Depends(current_user)]):
    return (
        account_result(user, token)
        if user is not None and token
        else AccountResponse(user=None, csrf_token=None)
    )


@router.post(
    "/logout",
    status_code=204,
    summary="Sign out of this session",
    description="Requires the session cookie and X-CSRF-Token. Deletes this session immediately "
    "and clears its cookie; other devices stay signed in.",
)
def logout(response: Response, user: SignedInUser, token: CookieToken):
    with AuthSessionLocal.begin() as session:
        session.execute(
            delete(AuthSession).where(
                AuthSession.token_hash == token_digest(token),
                AuthSession.user_id == user.user_id,
            )
        )
    clear_session_cookie(response)
