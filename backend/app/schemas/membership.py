"""Membership write payload and named Swagger examples."""

from datetime import date
from typing import Self

from pydantic import Field, model_validator

from .base import WriteModel


class MembershipWrite(WriteModel):
    """An athlete's dated stint on a team's seasonal roster."""

    roster_id: int = Field(
        gt=0,
        description="Existing roster ID. Seeded roster 81 is Alder Bay Foxes in the 2026 season.",
        examples=[81],
    )
    athlete_id: int = Field(
        gt=0,
        description="Existing athlete ID from GET /api/lookups or POST /api/athletes.",
        examples=[1],
    )
    position: str = Field(
        min_length=1,
        max_length=40,
        description="Position label, such as QB, RB, WR, LB, or DB; not a fixed enum.",
        examples=["WR"],
    )
    jersey_number: str | None = Field(
        default=None,
        max_length=10,
        description="Optional string so leading zeros survive. Null or omission clears it on PUT.",
        examples=["00"],
    )
    start_date: date = Field(
        description=(
            "Inclusive start date in YYYY-MM-DD format, within the roster's season. "
            "The roster, athlete, and start date together must be unique."
        ),
        examples=["2026-08-01"],
    )
    end_date: date | None = Field(
        default=None,
        description=(
            "Inclusive end date in YYYY-MM-DD format; cannot precede the start or exceed "
            "the season's end. Null means no recorded end. Omission clears it on PUT."
        ),
        examples=["2027-02-28"],
    )

    @model_validator(mode="after")
    def ordered_dates(self) -> Self:
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date.")
        return self


MEMBERSHIP_EXAMPLES = {
    "new_athlete_stint": {
        "summary": "Assign a newly created athlete to Alder Bay's 2026 roster",
        "description": (
            "Prerequisite: POST an athlete first. Replace illustrative athlete_id 101 "
            "with the returned ID; 101 is not present in the initial seed. Roster 81 is "
            "the seeded Alder Bay Foxes roster for 2026. The dates fit that season. "
            'Jersey number is a string, so "00" keeps its leading zero. For PUT, load '
            "the current membership and submit every field you want to retain."
        ),
        "value": {
            "roster_id": 81,
            "athlete_id": 101,
            "position": "WR",
            "jersey_number": "00",
            "start_date": "2026-08-01",
            "end_date": "2027-02-28",
        },
    },
    "open_ended_stint": {
        "summary": "Membership with no jersey or recorded end date",
        "description": (
            "Uses the same newly created athlete prerequisite; replace athlete_id 101. "
            "This is an alternative to the dated stint example, not a second record for "
            "the same roster, athlete, and start date. Null clears jersey_number and "
            "end_date on PUT. The roster still identifies one particular season."
        ),
        "value": {
            "roster_id": 81,
            "athlete_id": 101,
            "position": "WR",
            "jersey_number": None,
            "start_date": "2026-08-01",
            "end_date": None,
        },
    },
}
