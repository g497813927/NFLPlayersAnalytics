"""Performance-statistic write payload and named Swagger examples."""

from typing import Self

from pydantic import Field, model_validator

from .base import WriteModel


class StatisticWrite(WriteModel):
    """One measured value for either an athlete or a team in a game."""

    game_id: int = Field(
        gt=0,
        description="Existing game ID from GET /api/games or GET /api/lookups.",
        examples=[81],
    )
    stat_definition_id: int = Field(
        gt=0,
        description=(
            "Existing statistic definition for the game's sport. "
            "Seeded definition 5 is rushing yards (RUSH_YDS)."
        ),
        examples=[5],
    )
    athlete_id: int | None = Field(
        default=None,
        gt=0,
        description=(
            "Athlete subject, mutually exclusive with team_id. The athlete needs an active "
            "membership on a participating team on the game date in the same season."
        ),
        examples=[1],
    )
    team_id: int | None = Field(
        default=None,
        gt=0,
        description="Team subject, mutually exclusive with athlete_id. Must be a participant in the game.",
        examples=[1],
    )
    stat_value: float = Field(
        allow_inf_nan=False,
        description=(
            "Finite numeric measurement; negative values are allowed. "
            "Each game, definition, and subject combination must be unique."
        ),
        examples=[18.0],
    )

    @model_validator(mode="after")
    def one_target(self) -> Self:
        if (self.athlete_id is None) == (self.team_id is None):
            raise ValueError("Choose either an athlete or a team for this statistic.")
        return self


STATISTIC_EXAMPLES = {
    "athlete_rushing_yards": {
        "summary": "Record an athlete's rushing yards",
        "description": (
            "Game 81 is the seeded 2026 Alder Bay versus Kestrel Hills game. Athlete 1, "
            "Alden Ashford, has a qualifying Alder Bay membership on its date. Definition "
            "5 is rushing yards. This athlete/definition/game combination is not seeded, "
            "so the first POST can create it; repeating it conflicts. Keep team_id null. "
            "For PUT, use the returned performance_statistic_id in the URL and include "
            "all desired fields."
        ),
        "value": {
            "game_id": 81,
            "stat_definition_id": 5,
            "athlete_id": 1,
            "team_id": None,
            "stat_value": 18.0,
        },
    },
    "team_rushing_yards": {
        "summary": "Record a participating team's rushing yards",
        "description": (
            "Team 1, Alder Bay Foxes, participates in seeded game 81. Definition 5 is "
            "rushing yards. This team/definition/game combination is also absent from "
            "the initial seed. Keep athlete_id null: each statistic describes exactly "
            "one athlete or one team. Repeating the same POST returns a duplicate error."
        ),
        "value": {
            "game_id": 81,
            "stat_definition_id": 5,
            "athlete_id": None,
            "team_id": 1,
            "stat_value": 138.0,
        },
    },
}
