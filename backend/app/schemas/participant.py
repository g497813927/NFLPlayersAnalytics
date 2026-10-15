"""One game participant embedded in a game write payload."""

from typing import Literal

from pydantic import Field

from .base import WriteModel


class ParticipantWrite(WriteModel):
    """One side of a game; submit together with the other participant."""

    team_id: int = Field(
        gt=0,
        description="Team in the game's league with an existing roster for the game's season.",
        examples=[1],
    )
    participant_role: Literal["home", "away"] = Field(
        description="Home or away designation. A game must contain exactly one of each.",
        examples=["home"],
    )
    score: int | None = Field(
        default=None,
        ge=0,
        description="Nonnegative integer score. Required for both participants when the game is completed.",
        examples=[24],
    )
