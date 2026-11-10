"""Current account and a browser-readable CSRF token (not the session secret)."""

from pydantic import BaseModel

from .account_user import AccountUser


class AccountResponse(BaseModel):
    user: AccountUser | None
    csrf_token: str | None
