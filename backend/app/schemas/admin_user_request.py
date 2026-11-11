"""Only an authenticated administrator may choose a new account's role."""

from typing import Literal

from pydantic import Field

from .register_request import RegisterRequest


class AdminUserRequest(RegisterRequest):
    role: Literal["fan", "analyst", "admin"] = Field(default="fan", examples=["fan"])
