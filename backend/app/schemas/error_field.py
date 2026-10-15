"""ErrorField documentation for the existing error response contract."""

from pydantic import BaseModel, Field


class ErrorField(BaseModel):
    field: str = Field(description="Invalid field path, such as participants.0.score.")
    message: str = Field(description="Readable explanation of the invalid value.")
