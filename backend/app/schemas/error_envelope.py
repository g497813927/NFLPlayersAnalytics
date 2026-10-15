"""ErrorEnvelope documentation for the existing error response contract."""

from pydantic import BaseModel

from .error_detail import ErrorDetail


class ErrorEnvelope(BaseModel):
    error: ErrorDetail
