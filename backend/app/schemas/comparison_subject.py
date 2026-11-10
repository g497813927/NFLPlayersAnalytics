"""A season-qualified team or athlete offered by the comparison selector."""

from pydantic import BaseModel, Field


class ComparisonSubject(BaseModel):
    id: int
    name: str
    detail: str
    positions: list[str] = Field(default_factory=list)
