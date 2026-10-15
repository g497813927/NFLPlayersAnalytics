"""Read-only derived season standings."""

from fastapi import APIRouter, Query
from sqlalchemy import select

from ..api_docs import LIST_RESPONSES
from ..response_docs import PAGINATED_RESPONSE
from ..models import Season, Standing, Team
from ..services import standing_view
from .common import DB, page_result

router = APIRouter()


@router.get(
    "/standings",
    tags=["Standings"],
    summary="Read basic season standings",
    description="""
    Search team names and filter by season, league, or team. Return paginated
    standings ordered by newest season, rank, and team name. Only completed
    games count. Points are `wins + 0.5 * ties`; win percentage divides those
    points by games played, or is zero when no games have been played.

    Equal percentages share dense ranks. These are basic demo standings, not
    official NFL tiebreakers. Game and roster writes refresh the derived table;
    this read endpoint does not recompute standings after manual SQL changes.
    """,
    responses={200: PAGINATED_RESPONSE, **LIST_RESPONSES},
)
def list_standings(
    session: DB,
    q: str | None = Query(
        None,
        description="Case-insensitive text contained in a team name.",
        examples=["Harbor"],
    ),
    season_id: int | None = Query(
        None, description="Select a season to read its standings.", examples=[1]
    ),
    league_id: int | None = Query(
        None, description="Only standings from seasons in this league.", examples=[1]
    ),
    team_id: int | None = Query(
        None, description="Only standings belonging to this team.", examples=[1]
    ),
    page: int = Query(1, ge=1, description="One-based result page.", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=200, description="Records per page, from 1 to 200.", examples=[20]
    ),
):
    statement = (
        select(Standing)
        .join(Team)
        .join(Season, Standing.season_id == Season.season_id)
        .order_by(Season.start_date.desc(), Standing.rank, Team.team_name)
    )
    if q:
        statement = statement.where(Team.team_name.icontains(q, autoescape=True))
    if season_id is not None:
        statement = statement.where(Standing.season_id == season_id)
    if league_id is not None:
        statement = statement.where(Season.league_id == league_id)
    if team_id is not None:
        statement = statement.where(Standing.team_id == team_id)
    return page_result(session, statement, standing_view, page, page_size)
