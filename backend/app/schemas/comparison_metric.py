"""One definition's aggregated values and observation counts."""

from typing import Literal

from pydantic import BaseModel


class ComparisonMetric(BaseModel):
    stat_definition_id: int
    name: str
    abbreviation: str
    calculation: Literal["sum", "average", "min", "max", "last"]
    left_value: float | None = None
    right_value: float | None = None
    left_samples: int = 0
    right_samples: int = 0
