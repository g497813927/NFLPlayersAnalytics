"""Team-season roster endpoints."""

from typing import Annotated

from fastapi import APIRouter, Body, Query, Response
from sqlalchemy import or_, select

from ..api_docs import LIST_RESPONSES, READ_RESPONSES, WRITE_RESPONSES
from ..models import Membership, Roster, Season, Team
from ..response_docs import PAGINATED_RESPONSE, RECORD_RESPONSE
from ..request_examples import ROSTER_EXAMPLES
from ..schemas import RosterWrite
from ..services import membership_view, require_record, roster_view
from .common import DB, page_result, save_changes

router = APIRouter()


@router.get(
    "/rosters",
    tags=["Rosters"],
    summary="Search team-season rosters",
    description="""
    Find the roster that connects a team to a season. Search team or season names
    and combine optional team, season, and league filters. Results are paginated,
    with readable team/season labels, newest seasons first and then team name.
    """,
    responses={200: PAGINATED_RESPONSE, **LIST_RESPONSES},
)
def list_rosters(
    session: DB,
    q: str | None = Query(
        None,
        description="Case-insensitive text contained in a team or season name.",
        examples=["2026"],
    ),
    team_id: int | None = Query(
        None, description="Team ID from /api/lookups.", examples=[1]
    ),
    season_id: int | None = Query(
        None, description="Season ID from /api/lookups.", examples=[1]
    ),
    league_id: int | None = Query(
        None, description="Only rosters for teams in this league.", examples=[1]
    ),
    page: int = Query(1, ge=1, description="One-based result page.", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=200, description="Records per page, from 1 to 200.", examples=[20]
    ),
):
    statement = (
        select(Roster)
        .join(Team)
        .join(Season, Roster.season_id == Season.season_id)
        .order_by(Season.start_date.desc(), Team.team_name)
    )
    if q:
        statement = statement.where(
            or_(
                Team.team_name.icontains(q, autoescape=True),
                Season.season_name.icontains(q, autoescape=True),
            )
        )
    if team_id is not None:
        statement = statement.where(Roster.team_id == team_id)
    if season_id is not None:
        statement = statement.where(Roster.season_id == season_id)
    if league_id is not None:
        statement = statement.where(Team.league_id == league_id)
    return page_result(session, statement, roster_view, page, page_size)


@router.get(
    "/rosters/{roster_id}",
    tags=["Rosters"],
    summary="Get a roster and its memberships",
    description="""
    Return one team-season roster with team/season labels and the athlete
    membership stints attached to it. Use its ID when creating a membership.
    """,
    responses={200: RECORD_RESPONSE, **READ_RESPONSES},
)
def get_roster(roster_id: int, session: DB):
    roster = require_record(session, Roster, roster_id, "roster")
    memberships = session.scalars(
        select(Membership).where(Membership.roster_id == roster_id)
    )
    return {
        **roster_view(session, roster),
        "memberships": [membership_view(session, row) for row in memberships],
    }


@router.post(
    "/rosters",
    tags=["Rosters"],
    summary="Create a team's season roster",
    description="""
    Choose an existing team and season from `/api/lookups`. They must belong to
    the same league, and each team can have only one roster per season.

    The roster starts without memberships. Standings for the selected season
    are refreshed in the same transaction.
    """,
    status_code=201,
    responses={201: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def create_roster(
    body: Annotated[RosterWrite, Body(openapi_examples=ROSTER_EXAMPLES)], session: DB
):
    require_record(session, Team, body.team_id, "team")
    require_record(session, Season, body.season_id, "season")
    roster = Roster(**body.model_dump())
    session.add(roster)
    save_changes(session, [body.season_id])
    return roster_view(session, roster)


@router.put(
    "/rosters/{roster_id}",
    tags=["Rosters"],
    summary="Replace a roster's team and season",
    description="""
    Send both team ID and season ID to replace the roster's editable values.
    Existing memberships stay attached to this roster ID.

    The replacement must preserve same-league, membership-date, game-roster,
    and statistic rules. Invalid changes roll back; affected seasons' standings
    are refreshed on success.
    """,
    responses={200: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def update_roster(
    roster_id: int,
    body: Annotated[RosterWrite, Body(openapi_examples=ROSTER_EXAMPLES)],
    session: DB,
):
    roster = require_record(session, Roster, roster_id, "roster")
    require_record(session, Team, body.team_id, "team")
    require_record(session, Season, body.season_id, "season")
    season_ids = [roster.season_id, body.season_id]
    for name, value in body.model_dump().items():
        setattr(roster, name, value)
    save_changes(session, season_ids, existing=True)
    return roster_view(session, roster)


@router.delete(
    "/rosters/{roster_id}",
    tags=["Rosters"],
    summary="Delete a roster and its memberships",
    description="""
    Deletion cascades to the roster's memberships and refreshes season standings.
    It is blocked if it would leave a game team without a required roster or an
    athlete statistic without a qualifying membership.

    Confirm the membership cascade in your client. A rejected deletion rolls
    back the entire transaction; success returns 204 without a response body.
    """,
    status_code=204,
    responses=WRITE_RESPONSES,
)
def delete_roster(roster_id: int, session: DB):
    roster = require_record(session, Roster, roster_id, "roster")
    season_id = roster.season_id
    session.delete(roster)
    save_changes(session, [season_id], existing=True)
    return Response(status_code=204)
