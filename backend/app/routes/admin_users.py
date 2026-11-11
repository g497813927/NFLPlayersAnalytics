"""Administrators can create credentials without changing their own session."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from ..api_docs import WRITE_RESPONSES, documented_error
from ..auth.database import AuthSessionLocal
from ..auth.dependencies import require_admin, require_json_origin
from ..auth.passwords import password_hasher
from ..auth.throttle import limit_account_attempts
from ..errors import AppError
from ..models import User, UserCredential
from ..schemas.account_user import AccountUser
from ..schemas.admin_user_request import AdminUserRequest

router = APIRouter(
    prefix="/admin/users",
    tags=["User administration"],
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
    dependencies=[
        Depends(require_admin),
        Depends(require_json_origin),
        Depends(limit_account_attempts),
    ],
)


@router.post(
    "",
    status_code=201,
    response_model=AccountUser,
    summary="Create a user as an administrator",
    description="Requires an admin session and X-CSRF-Token. Creates a new account with "
    "an Argon2 password hash; only fan and analyst roles are accepted, with fan the default. "
    "Provision administrators with the local create_admin command. "
    "This does not sign in as the new user or change the admin's current session. "
    "Existing emails (including seeded users) return 409 and are never overwritten. "
    "Passwords have 12–128 characters and are excluded from SQL traces. "
    "Use synthetic account details in this prototype; rate limits return 429.",
)
def create_user(payload: AdminUserRequest):
    with AuthSessionLocal.begin() as session:
        if session.scalar(select(User.user_id).where(func.lower(User.email) == payload.email)):
            raise AppError(
                409, "email_unavailable", "This email is already registered. Choose another email."
            )
        user = User(email=payload.email, display_name=payload.display_name, role=payload.role)
        session.add(user)
        try:
            session.flush()
            session.add(
                UserCredential(
                    user_id=user.user_id, password_hash=password_hasher.hash(payload.password)
                )
            )
            session.flush()
        except IntegrityError:
            raise AppError(
                409, "email_unavailable", "This email is already registered. Choose another email."
            ) from None
        result = AccountUser.model_validate(user)
    return result
