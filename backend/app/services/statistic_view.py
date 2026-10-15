"""Statistic view for the sports prototype."""

from sqlalchemy.orm import Session
from ..models import Athlete, Game, PerformanceStatistic, StatDefinition, Team

from .serialization import row_values
from .game_view import game_view


def statistic_view(session: Session, statistic: PerformanceStatistic) -> dict:
    definition = session.get(StatDefinition, statistic.stat_definition_id)
    game = game_view(session, session.get(Game, statistic.game_id))
    athlete = (
        session.get(Athlete, statistic.athlete_id)
        if statistic.athlete_id is not None
        else None
    )
    team = (
        session.get(Team, statistic.team_id) if statistic.team_id is not None else None
    )
    athlete_name = f"{athlete.first_name} {athlete.last_name}" if athlete else None
    return {
        **row_values(statistic),
        "stat_name": definition.stat_name,
        "abbreviation": definition.abbreviation,
        "calc_type": definition.calc_type,
        "sport_id": definition.sport_id,
        "athlete_name": athlete_name,
        "team_name": team.team_name if team else None,
        "subject_name": athlete_name or (team.team_name if team else None),
        "season_id": game["season_id"],
        "season_name": game["season_name"],
        "game_time": game["game_time"],
        "game_label": game["game_label"],
        "matchup": game["matchup"],
    }
