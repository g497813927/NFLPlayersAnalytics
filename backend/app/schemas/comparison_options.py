"""Complete selector data for one season, without pagination truncation."""

from pydantic import BaseModel

from .comparison_subject import ComparisonSubject


class ComparisonOptions(BaseModel):
    season_id: int
    season_name: str
    league_name: str
    teams: list[ComparisonSubject]
    athletes: list[ComparisonSubject]
