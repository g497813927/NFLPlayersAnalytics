"""Team write payload and named Swagger examples."""

from pydantic import Field

from .base import WriteModel


class TeamWrite(WriteModel):
    """Editable team fields; the server assigns the team ID."""

    team_name: str = Field(
        min_length=1,
        max_length=120,
        description="Team name, unique within the selected league.",
        examples=["Harbor City Owls"],
    )
    city: str = Field(
        min_length=1,
        max_length=100,
        description="The team's home city.",
        examples=["Harbor City"],
    )
    league_id: int = Field(
        gt=0,
        description="Existing league ID from GET /api/lookups. Seeded league 1 is Frontier Football League.",
        examples=[1],
    )


TEAM_EXAMPLES = {
    "fictional_team": {
        "summary": "Add a fictional team to the seeded league",
        "description": (
            "League 1 is the seeded Frontier Football League. This team name is not in the "
            "initial seed. POST once and keep the returned team_id; repeating the same POST "
            "returns a duplicate error. For PUT, use that team_id in the URL and send all "
            "three editable fields. Existing teams can be inspected with GET /api/teams/{team_id}."
        ),
        "value": {
            "team_name": "Harbor City Owls",
            "city": "Harbor City",
            "league_id": 1,
        },
    },
}
