"""An administrator may create normal users; admin provisioning stays local."""

from typing import Literal

from pydantic import Field

from .register_request import RegisterRequest


class AdminUserRequest(RegisterRequest):
    role: Literal["fan", "analyst"] = Field(default="fan", examples=["fan"])
