"""Read-only comparison of two subjects within the same season and sport."""

from typing import Literal

from pydantic import BaseModel

from .comparison_metric import ComparisonMetric
from .comparison_subject import ComparisonSubject

ComparisonKind = Literal["team", "athlete"]


class ComparisonResponse(BaseModel):
    subject_type: ComparisonKind
    season_id: int
    season_name: str
    league_name: str
    left: ComparisonSubject
    right: ComparisonSubject
    left_games: int
    right_games: int
    metrics: list[ComparisonMetric]
