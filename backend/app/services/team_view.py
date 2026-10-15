"""Team view for the sports prototype."""

from sqlalchemy.orm import Session
from ..models import League, Sport, Team

from .serialization import row_values


def team_view(session: Session, team: Team) -> dict:
    league = session.get(League, team.league_id)
    sport = session.get(Sport, league.sport_id)
    return {
        **row_values(team),
        "league_name": league.league_name,
        "sport_id": sport.sport_id,
        "sport_name": sport.sport_name,
    }
