"""Database-backed selector values for prototype forms."""

from fastapi import APIRouter
from sqlalchemy import select

from ..api_docs import LIST_RESPONSES
from ..response_docs import LOOKUPS_RESPONSE
from ..models import (
    Athlete,
    Game,
    League,
    Roster,
    Season,
    Sport,
    StatDefinition,
    Team,
    Venue,
)
from ..services import athlete_view, game_view, roster_view, row_values, team_view
from .common import DB

router = APIRouter()


@router.get(
    "/lookups",
    tags=["Lookups"],
    summary="Get records for form selectors",
    description="""
    Return unpaginated sports, leagues, seasons, venues, statistic definitions,
    teams, athletes, rosters, and games with human-readable labels.

    Use these records to choose existing foreign-key IDs before creating or
    updating data. Select a season's league and matching team rosters; IDs in
    request examples are illustrative and must exist in your current database.
    """,
    responses={200: LOOKUPS_RESPONSE, **LIST_RESPONSES},
)
def lookups(session: DB):
    leagues = session.scalars(select(League).order_by(League.league_name)).all()
    seasons = session.scalars(select(Season).order_by(Season.start_date.desc())).all()
    definitions = session.scalars(
        select(StatDefinition).order_by(StatDefinition.stat_name)
    ).all()
    return {
        "sports": [
            row_values(row)
            for row in session.scalars(select(Sport).order_by(Sport.sport_name))
        ],
        "leagues": [
            {
                **row_values(row),
                "sport_name": session.get(Sport, row.sport_id).sport_name,
            }
            for row in leagues
        ],
        "seasons": [
            {
                **row_values(row),
                "league_name": session.get(League, row.league_id).league_name,
                "sport_id": session.get(League, row.league_id).sport_id,
            }
            for row in seasons
        ],
        "venues": [
            row_values(row)
            for row in session.scalars(select(Venue).order_by(Venue.venue_name))
        ],
        "stat_definitions": [
            {
                **row_values(row),
                "sport_name": session.get(Sport, row.sport_id).sport_name,
            }
            for row in definitions
        ],
        "teams": [
            team_view(session, row)
            for row in session.scalars(select(Team).order_by(Team.team_name))
        ],
        "athletes": [
            athlete_view(session, row)
            for row in session.scalars(
                select(Athlete).order_by(Athlete.last_name, Athlete.first_name)
            )
        ],
        "rosters": [
            roster_view(session, row)
            for row in session.scalars(select(Roster).order_by(Roster.roster_id))
        ],
        "games": [
            game_view(session, row)
            for row in session.scalars(select(Game).order_by(Game.game_time.desc()))
        ],
    }
