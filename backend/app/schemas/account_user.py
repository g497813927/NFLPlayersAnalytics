"""Public account fields; credentials are never serialized."""

from typing import Literal

from pydantic import BaseModel, ConfigDict


class AccountUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    email: str
    display_name: str
    role: Literal["fan", "analyst", "admin"]
