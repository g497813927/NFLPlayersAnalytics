"""Account credentials; passwords retain their exact whitespace."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr = Field(max_length=254, examples=["fan@example.com"])
    password: str = Field(
        min_length=1,
        max_length=128,
        repr=False,
        examples=["Example-passphrase-2026"],
        json_schema_extra={"format": "password"},
    )

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()
