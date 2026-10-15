"""Athlete profiles, history, and CRUD endpoints."""

from typing import Annotated

from fastapi import APIRouter, Body, Query, Response
from sqlalchemy import select

from ..api_docs import LIST_RESPONSES, READ_RESPONSES, WRITE_RESPONSES
from ..models import Athlete, Game, Membership, PerformanceStatistic, Roster, Team
from ..response_docs import PAGINATED_RESPONSE, RECORD_RESPONSE
from ..request_examples import ATHLETE_EXAMPLES
from ..schemas import AthleteWrite
from ..services import athlete_view, membership_view, require_record, statistic_view
from .common import DB, page_result, save_changes

router = APIRouter()


@router.get(
    "/athletes",
    tags=["Athletes"],
    summary="Search athletes",
    description="""
    Search full names and optionally filter through roster memberships by team,
    season, or league. Membership filters include historical stints, not only
    currently active memberships. Return a paginated list ordered by last name,
    first name, and ID.
    """,
    responses={200: PAGINATED_RESPONSE, **LIST_RESPONSES},
)
def list_athletes(
    session: DB,
    q: str | None = Query(
        None,
        description="Case-insensitive text contained in the athlete's full name.",
        examples=["Avery"],
    ),
    team_id: int | None = Query(
        None,
        description="Athletes with a membership on this team's roster.",
        examples=[1],
    ),
    season_id: int | None = Query(
        None,
        description="Athletes with a roster membership in this season.",
        examples=[1],
    ),
    league_id: int | None = Query(
        None, description="Athletes with a membership in this league.", examples=[1]
    ),
    page: int = Query(1, ge=1, description="One-based result page.", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=200, description="Records per page, from 1 to 200.", examples=[20]
    ),
):
    statement = select(Athlete).order_by(
        Athlete.last_name, Athlete.first_name, Athlete.athlete_id
    )
    if q:
        statement = statement.where(
            (Athlete.first_name + " " + Athlete.last_name).icontains(q, autoescape=True)
        )
    if any(value is not None for value in (team_id, season_id, league_id)):
        related = select(Membership.athlete_id).join(Roster).join(Team)
        if team_id is not None:
            related = related.where(Roster.team_id == team_id)
        if season_id is not None:
            related = related.where(Roster.season_id == season_id)
        if league_id is not None:
            related = related.where(Team.league_id == league_id)
        statement = statement.where(Athlete.athlete_id.in_(related))
    return page_result(session, statement, athlete_view, page, page_size)


@router.get(
    "/athletes/{athlete_id}",
    tags=["Athletes"],
    summary="Get an athlete's profile and history",
    description="""
    Return the athlete's profile, roster membership history, and game statistics
    with related team, season, and game labels. Memberships and statistics are
    listed newest first by start date and game time respectively.
    """,
    responses={200: RECORD_RESPONSE, **READ_RESPONSES},
)
def get_athlete(athlete_id: int, session: DB):
    athlete = require_record(session, Athlete, athlete_id, "athlete")
    memberships = session.scalars(
        select(Membership)
        .where(Membership.athlete_id == athlete_id)
        .order_by(Membership.start_date.desc())
    )
    statistics = session.scalars(
        select(PerformanceStatistic)
        .join(Game)
        .where(PerformanceStatistic.athlete_id == athlete_id)
        .order_by(Game.game_time.desc())
    )
    return {
        **athlete_view(session, athlete),
        "memberships": [membership_view(session, row) for row in memberships],
        "statistics": [statistic_view(session, row) for row in statistics],
    }


@router.post(
    "/athletes",
    tags=["Athletes"],
    summary="Create an athlete profile",
    description="""
    Create a fictional athlete with first and last names and optional nationality.
    Names do not have to be unique. Add roster participation separately through
    the Memberships endpoints.
    """,
    status_code=201,
    responses={201: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def create_athlete(
    body: Annotated[AthleteWrite, Body(openapi_examples=ATHLETE_EXAMPLES)], session: DB
):
    athlete = Athlete(**body.model_dump())
    session.add(athlete)
    save_changes(session)
    return athlete_view(session, athlete)


@router.put(
    "/athletes/{athlete_id}",
    tags=["Athletes"],
    summary="Replace an athlete's profile values",
    description="""
    Send the complete editable profile. First and last names are required;
    omitting nationality resets it to null. This full replacement leaves the
    athlete's ID, roster memberships, and statistics associated with the profile.
    """,
    responses={200: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def update_athlete(
    athlete_id: int,
    body: Annotated[AthleteWrite, Body(openapi_examples=ATHLETE_EXAMPLES)],
    session: DB,
):
    athlete = require_record(session, Athlete, athlete_id, "athlete")
    for name, value in body.model_dump().items():
        setattr(athlete, name, value)
    save_changes(session, existing=True)
    return athlete_view(session, athlete)


@router.delete(
    "/athletes/{athlete_id}",
    tags=["Athletes"],
    summary="Delete an unreferenced athlete",
    description="""
    Delete an athlete only when no membership or performance statistic references
    the profile. Favorites and saved comparisons referencing it cascade on a
    successful deletion. Confirm in your client first; success has no response body.
    """,
    status_code=204,
    responses=WRITE_RESPONSES,
)
def delete_athlete(athlete_id: int, session: DB):
    session.delete(require_record(session, Athlete, athlete_id, "athlete"))
    save_changes(session, existing=True)
    return Response(status_code=204)
