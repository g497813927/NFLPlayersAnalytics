"""Team browsing and CRUD endpoints."""

from typing import Annotated

from fastapi import APIRouter, Body, Query, Response
from sqlalchemy import or_, select

from ..api_docs import LIST_RESPONSES, READ_RESPONSES, WRITE_RESPONSES
from ..models import League, Membership, Roster, Team
from ..response_docs import PAGINATED_RESPONSE, RECORD_RESPONSE
from ..request_examples import TEAM_EXAMPLES
from ..schemas import TeamWrite
from ..services import membership_view, require_record, roster_view, team_view
from .common import DB, page_result, save_changes

router = APIRouter()


@router.get(
    "/teams",
    tags=["Teams"],
    summary="Search teams",
    description="""
    Search team names or cities and optionally filter by league or roster season.
    Filters combine with AND. Return a paginated list with league and sport labels,
    ordered by team name and then ID.
    """,
    responses={200: PAGINATED_RESPONSE, **LIST_RESPONSES},
)
def list_teams(
    session: DB,
    q: str | None = Query(
        None,
        description="Case-insensitive text contained in a team name or city.",
        examples=["Harbor"],
    ),
    league_id: int | None = Query(
        None, description="League ID from /api/lookups.", examples=[1]
    ),
    season_id: int | None = Query(
        None, description="Only teams with a roster in this season.", examples=[1]
    ),
    page: int = Query(1, ge=1, description="One-based result page.", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=200, description="Records per page, from 1 to 200.", examples=[20]
    ),
):
    statement = select(Team).join(League).order_by(Team.team_name, Team.team_id)
    if q:
        statement = statement.where(
            or_(
                Team.team_name.icontains(q, autoescape=True),
                Team.city.icontains(q, autoescape=True),
            )
        )
    if league_id is not None:
        statement = statement.where(Team.league_id == league_id)
    if season_id is not None:
        statement = statement.where(
            Team.team_id.in_(
                select(Roster.team_id).where(Roster.season_id == season_id)
            )
        )
    return page_result(session, statement, team_view, page, page_size)


@router.get(
    "/teams/{team_id}",
    tags=["Teams"],
    summary="Get a team and its roster history",
    description="""
    Return one team with league and sport labels, its season rosters, and the
    memberships associated with those rosters. Use the team's current values
    when preparing a replacement PUT request.
    """,
    responses={200: RECORD_RESPONSE, **READ_RESPONSES},
)
def get_team(team_id: int, session: DB):
    team = require_record(session, Team, team_id, "team")
    rosters = session.scalars(
        select(Roster).where(Roster.team_id == team_id).order_by(Roster.season_id)
    ).all()
    memberships = session.scalars(
        select(Membership)
        .join(Roster)
        .where(Roster.team_id == team_id)
        .order_by(Membership.start_date)
    )
    return {
        **team_view(session, team),
        "rosters": [roster_view(session, row) for row in rosters],
        "memberships": [membership_view(session, row) for row in memberships],
    }


@router.post(
    "/teams",
    tags=["Teams"],
    summary="Create a team",
    description="""
    Create a team in an existing league selected from `/api/lookups`.
    Team names must be unique within that league. Return the created record
    with its generated ID and league/sport labels.
    """,
    status_code=201,
    responses={201: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def create_team(
    body: Annotated[TeamWrite, Body(openapi_examples=TEAM_EXAMPLES)], session: DB
):
    require_record(session, League, body.league_id, "league")
    team = Team(**body.model_dump())
    session.add(team)
    save_changes(session)
    return team_view(session, team)


@router.put(
    "/teams/{team_id}",
    tags=["Teams"],
    summary="Replace a team's editable values",
    description="""
    Send the complete team payload, including name, city, and league ID.
    This is a full replacement of editable values, not a partial update.

    Changing the league is rejected if it would invalidate existing rosters,
    games, or statistics. A rejected update rolls back entirely.
    """,
    responses={200: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def update_team(
    team_id: int,
    body: Annotated[TeamWrite, Body(openapi_examples=TEAM_EXAMPLES)],
    session: DB,
):
    team = require_record(session, Team, team_id, "team")
    require_record(session, League, body.league_id, "league")
    for name, value in body.model_dump().items():
        setattr(team, name, value)
    save_changes(session, existing=True)
    return team_view(session, team)


@router.delete(
    "/teams/{team_id}",
    tags=["Teams"],
    summary="Delete an unreferenced team",
    description="""
    Delete a team only when no roster, game participant, or performance statistic
    still references it. Dependent favorites, saved comparisons, and derived
    standings are removed by database cascades when deletion is allowed.

    Confirm the deletion in your client before calling this endpoint. Success
    returns 204 with no response body; a blocked deletion returns a readable error.
    """,
    status_code=204,
    responses=WRITE_RESPONSES,
)
def delete_team(team_id: int, session: DB):
    session.delete(require_record(session, Team, team_id, "team"))
    save_changes(session, existing=True)
    return Response(status_code=204)
