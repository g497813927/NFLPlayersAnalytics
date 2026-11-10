"""Public registration always creates a normal account."""

from pydantic import Field, field_validator

from .login_request import LoginRequest


class RegisterRequest(LoginRequest):
    display_name: str = Field(min_length=1, max_length=100, examples=["Demo Fan"])
    password: str = Field(
        min_length=12,
        max_length=128,
        repr=False,
        examples=["Example-passphrase-2026"],
        json_schema_extra={"format": "password"},
    )

    @field_validator("display_name")
    @classmethod
    def meaningful_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Enter a display name.")
        return value
