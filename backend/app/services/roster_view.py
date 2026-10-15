"""Roster view for the sports prototype."""

from sqlalchemy.orm import Session
from ..models import Roster, Season, Team

from .serialization import row_values


def roster_view(session: Session, roster: Roster) -> dict:
    team = session.get(Team, roster.team_id)
    season = session.get(Season, roster.season_id)
    return {
        **row_values(roster),
        "team_name": team.team_name,
        "season_name": season.season_name,
        "league_id": season.league_id,
        "label": f"{team.team_name} · {season.season_name}",
    }
