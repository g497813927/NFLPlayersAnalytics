"""Shared request-model configuration."""

from pydantic import BaseModel, ConfigDict


class WriteModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
