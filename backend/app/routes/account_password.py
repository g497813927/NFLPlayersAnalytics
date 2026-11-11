"""Password changes use the private engine and revoke all previous sessions."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy import delete, update

from ..api_docs import WRITE_RESPONSES, documented_error
from ..auth.database import AuthSessionLocal
from ..auth.dependencies import SignedInUser, require_json_origin
from ..auth.passwords import password_hasher, verify_password
from ..auth.sessions import create_session, csrf_token, set_session_cookie
from ..auth.throttle import limit_account_attempts
from ..errors import AppError
from ..models import AuthSession, UserCredential
from ..schemas.account_response import AccountResponse
from ..schemas.account_user import AccountUser
from ..schemas.password_change_request import PasswordChangeRequest

router = APIRouter(
    prefix="/auth",
    tags=["Accounts"],
    responses={
        **WRITE_RESPONSES,
        415: documented_error(
            "JSON is required.", "json_required", "Send account details as JSON."
        ),
        429: documented_error(
            "Account attempt limit or request guard block; retry later.",
            "too_many_attempts",
            "Too many account attempts. Wait a minute and try again.",
        ),
    },
)


@router.post(
    "/password",
    response_model=AccountResponse,
    dependencies=[Depends(require_json_origin), Depends(limit_account_attempts)],
    summary="Change your password",
    description="Requires your session cookie, X-CSRF-Token, and current password. "
    "The new password must have 12–128 characters. Revokes every previous session, "
    "including other devices, and returns a fresh session cookie and csrf_token. "
    "The account is derived from the session; passwords never enter SQL traces. "
    "An incorrect current password returns 422; rate limits return 429.",
)
def change_password(payload: PasswordChangeRequest, response: Response, user: SignedInUser):
    with AuthSessionLocal.begin() as session:
        credential = session.get(UserCredential, user.user_id)
        if not verify_password(
            payload.current_password, credential.password_hash if credential else None
        ):
            raise AppError(422, "incorrect_password", "Your current password is incorrect.")
        if payload.new_password == payload.current_password:
            raise AppError(422, "unchanged_password", "Choose a different new password.")
        result = session.execute(
            update(UserCredential)
            .where(
                UserCredential.user_id == user.user_id,
                UserCredential.password_hash == credential.password_hash,
            )
            .values(password_hash=password_hasher.hash(payload.new_password))
        )
        if result.rowcount != 1:
            raise AppError(409, "account_changed", "Your account changed. Sign in and try again.")
        session.execute(delete(AuthSession).where(AuthSession.user_id == user.user_id))
        token = create_session(session, user.user_id, None)
        account = AccountResponse(
            user=AccountUser.model_validate(user), csrf_token=csrf_token(token)
        )
    set_session_cookie(response, token)
    return account
