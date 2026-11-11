"""Change a password without accepting an account ID from the client."""

from pydantic import BaseModel, ConfigDict, Field


class PasswordChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(
        min_length=1,
        max_length=128,
        repr=False,
        json_schema_extra={"format": "password"},
        examples=["Current-example-passphrase"],
    )
    new_password: str = Field(
        min_length=12,
        max_length=128,
        repr=False,
        json_schema_extra={"format": "password"},
        examples=["New-example-passphrase-2026"],
    )
