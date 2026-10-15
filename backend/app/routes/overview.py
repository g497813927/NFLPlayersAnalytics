"""Dashboard summary endpoints."""

from fastapi import APIRouter
from sqlalchemy import func, select

from ..api_docs import LIST_RESPONSES
from ..response_docs import OVERVIEW_RESPONSE
from ..models import (
    Athlete,
    Game,
    League,
    Membership,
    PerformanceStatistic,
    Roster,
    Sport,
    Team,
)
from ..services import game_view
from .common import DB

router = APIRouter()


@router.get(
    "/overview",
    tags=["Overview"],
    summary="Get dashboard counts and recent results",
    description="""
    Return record counts and the five most recent completed games, including
    team labels, participants, and scores. This endpoint is not paginated.
    """,
    responses={200: OVERVIEW_RESPONSE, **LIST_RESPONSES},
)
def overview(session: DB):
    counts = {
        name: session.scalar(select(func.count()).select_from(model))
        for name, model in (
            ("sports", Sport),
            ("leagues", League),
            ("teams", Team),
            ("athletes", Athlete),
            ("rosters", Roster),
            ("memberships", Membership),
            ("games", Game),
            ("performance_statistics", PerformanceStatistic),
        )
    }
    recent = session.scalars(
        select(Game)
        .where(Game.status == "completed")
        .order_by(Game.game_time.desc())
        .limit(5)
    )
    return {
        "counts": counts,
        "recent_games": [game_view(session, game) for game in recent],
    }
