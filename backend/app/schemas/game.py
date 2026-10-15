"""Game write payload, participant validation, and Swagger examples."""

from datetime import datetime, timezone
from typing import Literal, Self

from pydantic import Field, field_validator, model_validator

from .base import WriteModel
from .participant import ParticipantWrite


class GameWrite(WriteModel):
    """A game and its two participants, saved together in one transaction."""

    game_time: datetime = Field(
        description=(
            "ISO 8601 kickoff timestamp within the season. Include Z or an offset; offsets are "
            "normalized to UTC. Timestamps without an offset are treated as UTC."
        ),
        examples=["2026-11-01T18:00:00Z"],
    )
    status: Literal["scheduled", "in_progress", "completed", "cancelled"] = Field(
        description="Game state. Only completed games contribute to the derived standings.",
        examples=["scheduled"],
    )
    season_id: int = Field(
        gt=0,
        description="Existing season ID. Seeded season 5 spans 2026-08-01 through 2027-02-28.",
        examples=[5],
    )
    venue_id: int | None = Field(
        default=None,
        gt=0,
        description="Optional venue ID from GET /api/lookups. Null or omission clears the venue on PUT.",
        examples=[1],
    )
    participants: list[ParticipantWrite] = Field(
        min_length=2,
        max_length=2,
        description=(
            "Exactly two distinct teams: one home and one away. PUT replaces this entire pair; "
            "include both participants even when changing only one score."
        ),
    )

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
        if self.status == "completed" and any(
            p.score is None for p in self.participants
        ):
            raise ValueError("Enter both scores before marking a game completed.")
        return self


GAME_EXAMPLES = {
    "scheduled_fixture": {
        "summary": "Schedule Alder Bay versus Briar Glen",
        "description": (
            "All referenced IDs exist in the seed: season 5 is 2026, team 1 is Alder Bay "
            "Foxes, team 2 is Briar Glen Owls, and venue 1 is Alder Bay Community Field. "
            "Both teams already have 2026 rosters. Kickoff is 18:00 UTC. A scheduled game "
            "may have null scores. Keep the returned game_id to record its result with PUT."
        ),
        "value": {
            "game_time": "2026-11-01T18:00:00Z",
            "status": "scheduled",
            "season_id": 5,
            "venue_id": 1,
            "participants": [
                {
                    "team_id": 1,
                    "participant_role": "home",
                    "score": None,
                },
                {
                    "team_id": 2,
                    "participant_role": "away",
                    "score": None,
                },
            ],
        },
    },
    "completed_result": {
        "summary": "Record a 24–17 final result",
        "description": (
            "To finish the scheduled fixture above, PUT this complete payload to its "
            "returned game_id. Both nonnegative scores are required. The entire participant "
            "pair is replaced, and standings are recalculated. POST would create a separate "
            "completed game, so use PUT when recording a result for an existing fixture."
        ),
        "value": {
            "game_time": "2026-11-01T18:00:00Z",
            "status": "completed",
            "season_id": 5,
            "venue_id": 1,
            "participants": [
                {
                    "team_id": 1,
                    "participant_role": "home",
                    "score": 24,
                },
                {
                    "team_id": 2,
                    "participant_role": "away",
                    "score": 17,
                },
            ],
        },
    },
}
