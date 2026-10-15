"""Request shapes for the deliberately small prototype API."""

from datetime import date, datetime, timezone
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class WriteModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class TeamWrite(WriteModel):
    team_name: str = Field(min_length=1, max_length=120)
    city: str = Field(min_length=1, max_length=100)
    league_id: int = Field(gt=0)


class AthleteWrite(WriteModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    nationality: str | None = Field(default=None, max_length=80)


class RosterWrite(WriteModel):
    team_id: int = Field(gt=0)
    season_id: int = Field(gt=0)


class MembershipWrite(WriteModel):
    roster_id: int = Field(gt=0)
    athlete_id: int = Field(gt=0)
    position: str = Field(min_length=1, max_length=40)
    jersey_number: str | None = Field(default=None, max_length=10)
    start_date: date
    end_date: date | None = None

    @model_validator(mode="after")
    def ordered_dates(self) -> Self:
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date.")
        return self


class ParticipantWrite(WriteModel):
    team_id: int = Field(gt=0)
    participant_role: Literal["home", "away"]
    score: int | None = Field(default=None, ge=0)


class GameWrite(WriteModel):
    game_time: datetime
    status: Literal["scheduled", "in_progress", "completed", "cancelled"]
    season_id: int = Field(gt=0)
    venue_id: int | None = Field(default=None, gt=0)
    participants: list[ParticipantWrite] = Field(min_length=2, max_length=2)

    @field_validator("game_time")
    @classmethod
    def utc_game_time(cls, value: datetime) -> datetime:
        if value.tzinfo is not None:
            return value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    @model_validator(mode="after")
    def valid_participants(self) -> Self:
        if {p.participant_role for p in self.participants} != {"home", "away"}:
            raise ValueError("Choose one home team and one away team.")
        if len({p.team_id for p in self.participants}) != 2:
            raise ValueError("Home and away teams must be different.")
        if self.status == "completed" and any(p.score is None for p in self.participants):
            raise ValueError("Enter both scores before marking a game completed.")
        return self


class StatisticWrite(WriteModel):
    game_id: int = Field(gt=0)
    stat_definition_id: int = Field(gt=0)
    athlete_id: int | None = Field(default=None, gt=0)
    team_id: int | None = Field(default=None, gt=0)
    stat_value: float = Field(allow_inf_nan=False)

    @model_validator(mode="after")
    def one_target(self) -> Self:
        if (self.athlete_id is None) == (self.team_id is None):
            raise ValueError("Choose either an athlete or a team for this statistic.")
        return self
