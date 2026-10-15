"""Athlete membership stints and CRUD endpoints."""

from typing import Annotated

from fastapi import APIRouter, Body, Query, Response
from sqlalchemy import or_, select

from ..api_docs import LIST_RESPONSES, READ_RESPONSES, WRITE_RESPONSES
from ..models import Athlete, Membership, Roster, Team
from ..response_docs import PAGINATED_RESPONSE, RECORD_RESPONSE
from ..request_examples import MEMBERSHIP_EXAMPLES
from ..schemas import MembershipWrite
from ..services import membership_view, require_record
from .common import DB, page_result, save_changes

router = APIRouter()


@router.get(
    "/memberships",
    tags=["Memberships"],
    summary="Search athlete roster memberships",
    description="""
    Search athlete or team names and combine roster, athlete, team, season, and
    league filters. Return paginated membership stints with athlete/team/season
    labels, ordered by athlete last name and membership ID. Historical stints
    are included; this endpoint does not apply an active-date filter.
    """,
    responses={200: PAGINATED_RESPONSE, **LIST_RESPONSES},
)
def list_memberships(
    session: DB,
    q: str | None = Query(
        None,
        description="Case-insensitive text contained in an athlete or team name.",
        examples=["Avery"],
    ),
    roster_id: int | None = Query(
        None, description="Roster ID from /api/lookups.", examples=[1]
    ),
    athlete_id: int | None = Query(
        None, description="Only memberships belonging to this athlete.", examples=[1]
    ),
    team_id: int | None = Query(
        None, description="Only memberships on this team's rosters.", examples=[1]
    ),
    season_id: int | None = Query(
        None, description="Only memberships on rosters for this season.", examples=[1]
    ),
    league_id: int | None = Query(
        None, description="Only memberships for teams in this league.", examples=[1]
    ),
    page: int = Query(1, ge=1, description="One-based result page.", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=200, description="Records per page, from 1 to 200.", examples=[20]
    ),
):
    statement = (
        select(Membership)
        .join(Roster)
        .join(Team)
        .join(Athlete, Membership.athlete_id == Athlete.athlete_id)
        .order_by(Athlete.last_name, Membership.membership_id)
    )
    if q:
        statement = statement.where(
            or_(
                (Athlete.first_name + " " + Athlete.last_name).icontains(
                    q, autoescape=True
                ),
                Team.team_name.icontains(q, autoescape=True),
            )
        )
    for column, value in (
        (Membership.roster_id, roster_id),
        (Membership.athlete_id, athlete_id),
        (Roster.team_id, team_id),
        (Roster.season_id, season_id),
        (Team.league_id, league_id),
    ):
        if value is not None:
            statement = statement.where(column == value)
    return page_result(session, statement, membership_view, page, page_size)


@router.get(
    "/memberships/{membership_id}",
    tags=["Memberships"],
    summary="Get a membership stint",
    description="""
    Return one athlete's roster membership, including position, jersey number,
    calendar dates, and readable athlete, team, season, and roster labels.
    """,
    responses={200: RECORD_RESPONSE, **READ_RESPONSES},
)
def get_membership(membership_id: int, session: DB):
    return membership_view(
        session, require_record(session, Membership, membership_id, "membership")
    )


@router.post(
    "/memberships",
    tags=["Memberships"],
    summary="Add an athlete to a roster",
    description="""
    Select an existing athlete and roster from `/api/lookups`. The start date must
    fall within the roster's season. An end date, when supplied, must be between
    the start date and season end; null leaves the stint open within that season.

    The same athlete, roster, and start date combination must be unique. Jersey
    numbers are strings so values such as `00` keep their leading zero.
    """,
    status_code=201,
    responses={201: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def create_membership(
    body: Annotated[MembershipWrite, Body(openapi_examples=MEMBERSHIP_EXAMPLES)],
    session: DB,
):
    require_record(session, Roster, body.roster_id, "roster")
    require_record(session, Athlete, body.athlete_id, "athlete")
    membership = Membership(**body.model_dump())
    session.add(membership)
    save_changes(session)
    return membership_view(session, membership)


@router.put(
    "/memberships/{membership_id}",
    tags=["Memberships"],
    summary="Replace a membership's editable values",
    description="""
    Send the complete membership payload. Omitted optional jersey number or end
    date resets that value to null. Dates must remain within the roster's season.

    Changing the athlete, roster, or dates is rejected if an existing athlete
    statistic would lose its qualifying membership on the game's date.
    """,
    responses={200: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def update_membership(
    membership_id: int,
    body: Annotated[MembershipWrite, Body(openapi_examples=MEMBERSHIP_EXAMPLES)],
    session: DB,
):
    membership = require_record(session, Membership, membership_id, "membership")
    require_record(session, Roster, body.roster_id, "roster")
    require_record(session, Athlete, body.athlete_id, "athlete")
    for name, value in body.model_dump().items():
        setattr(membership, name, value)
    save_changes(session, existing=True)
    return membership_view(session, membership)


@router.delete(
    "/memberships/{membership_id}",
    tags=["Memberships"],
    summary="Delete a membership stint",
    description="""
    Remove a membership while retaining its athlete and roster. Deletion is
    blocked if it would leave an athlete statistic without an active membership
    on a participating team on the game's date.

    Confirm in your client first. Success returns 204 with no response body.
    """,
    status_code=204,
    responses=WRITE_RESPONSES,
)
def delete_membership(membership_id: int, session: DB):
    session.delete(require_record(session, Membership, membership_id, "membership"))
    save_changes(session, existing=True)
    return Response(status_code=204)
