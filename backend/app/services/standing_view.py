"""Standing view for the sports prototype."""

from sqlalchemy.orm import Session
from ..models import Season, Standing, Team

from .serialization import row_values


def standing_view(session: Session, standing: Standing) -> dict:
    team = session.get(Team, standing.team_id)
    season = session.get(Season, standing.season_id)
    played = standing.wins + standing.losses + standing.ties
    return {
        **row_values(standing),
        "team_name": team.team_name,
        "season_name": season.season_name,
        "league_id": season.league_id,
        "games_played": played,
        "win_percentage": (standing.wins + 0.5 * standing.ties) / played
        if played
        else 0.0,
    }
