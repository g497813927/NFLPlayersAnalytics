"""Roster write payload and named Swagger examples."""

from pydantic import Field

from .base import WriteModel


class RosterWrite(WriteModel):
    """One team's roster for one season; each team/season pair is unique."""

    team_id: int = Field(
        gt=0,
        description=(
            "Existing team ID from GET /api/lookups or POST /api/teams. "
            "The team must belong to the season's league."
        ),
        examples=[1],
    )
    season_id: int = Field(
        gt=0,
        description="Existing season ID from GET /api/lookups. Seeded season 5 is the 2026 season.",
        examples=[5],
    )


ROSTER_EXAMPLES = {
    "new_team_season": {
        "summary": "Create a 2026 roster after creating a team",
        "description": (
            "Prerequisite: POST a team in league 1 first. Replace illustrative team_id 21 "
            "with the ID returned by that request; 21 is not present in the initial seed. "
            "Season 5 is the seeded 2026 season. All 20 seeded teams already have a roster "
            "for every seeded season, so reusing one of those team/season pairs would conflict. "
            "For PUT, load the selected roster first and include both IDs."
        ),
        "value": {
            "team_id": 21,
            "season_id": 5,
        },
    },
}
