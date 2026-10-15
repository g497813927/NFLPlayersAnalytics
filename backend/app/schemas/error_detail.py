"""ErrorDetail documentation for the existing error response contract."""

from pydantic import BaseModel, Field

from .error_field import ErrorField


class ErrorDetail(BaseModel):
    code: str = Field(description="Stable application error identifier.")
    message: str = Field(
        description="Readable message suitable for display in the frontend."
    )
    fields: list[ErrorField] | None = Field(
        default=None,
        description="Field issues, included for request validation failures when available.",
    )
