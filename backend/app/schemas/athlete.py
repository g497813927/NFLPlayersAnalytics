"""Athlete write payload and named Swagger examples."""

from pydantic import Field

from .base import WriteModel


class AthleteWrite(WriteModel):
    """Editable athlete details, separate from team and season memberships."""

    first_name: str = Field(
        min_length=1,
        max_length=80,
        description="Athlete's given name. Use fictional people for this prototype.",
        examples=["Rowan"],
    )
    last_name: str = Field(
        min_length=1,
        max_length=80,
        description="Athlete's family name.",
        examples=["Mercer"],
    )
    nationality: str | None = Field(
        default=None,
        max_length=80,
        description="Optional nationality. Null or omission leaves it unset; on PUT, either clears it.",
        examples=["United States"],
    )


ATHLETE_EXAMPLES = {
    "fictional_athlete": {
        "summary": "Add a fictional athlete",
        "description": (
            "Creates Rowan Mercer without assigning a team; use a membership for that next. "
            "Save the returned athlete_id. For PUT, use the athlete's ID in the URL and send "
            "the complete editable details. Names are not unique identifiers."
        ),
        "value": {
            "first_name": "Rowan",
            "last_name": "Mercer",
            "nationality": "United States",
        },
    },
    "nationality_unset": {
        "summary": "Leave nationality unset or clear it on update",
        "description": (
            "Null is valid for nationality. On PUT it clears the existing nationality; "
            "keep the desired first_name and last_name in the same request."
        ),
        "value": {
            "first_name": "Rowan",
            "last_name": "Mercer",
            "nationality": None,
        },
    },
}
