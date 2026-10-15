"""Per-game athlete or team performance statistic endpoints."""

from typing import Annotated

from fastapi import APIRouter, Body, Query, Response
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..api_docs import LIST_RESPONSES, READ_RESPONSES, WRITE_RESPONSES
from ..models import Athlete, Game, PerformanceStatistic, Season, StatDefinition, Team
from ..response_docs import PAGINATED_RESPONSE, RECORD_RESPONSE
from ..request_examples import STATISTIC_EXAMPLES
from ..schemas import StatisticWrite
from ..services import require_record, statistic_view
from .common import DB, page_result, save_changes

router = APIRouter()


@router.get(
    "/performance-statistics",
    tags=["Performance statistics"],
    summary="Search game performance statistics",
    description="""
    Search statistic names or subject names and combine game, season, league,
    definition, or subject filters. Return paginated values with definition,
    subject, and game labels, newest games first and then statistic ID.

    `team_id` filters team-subject statistics, not the statistics of all athletes
    on that team. Every row has exactly one subject; providing both athlete and
    team filters therefore returns no matches.
    """,
    responses={200: PAGINATED_RESPONSE, **LIST_RESPONSES},
)
def list_statistics(
    session: DB,
    q: str | None = Query(
        None,
        description="Case-insensitive text in a statistic name, athlete name, or team subject name.",
        examples=["yards"],
    ),
    athlete_id: int | None = Query(
        None, description="Statistics whose subject is this athlete.", examples=[1]
    ),
    team_id: int | None = Query(
        None,
        description="Statistics whose subject is this team; excludes athlete-subject statistics.",
        examples=[1],
    ),
    game_id: int | None = Query(
        None, description="Only statistics recorded for this game.", examples=[1]
    ),
    season_id: int | None = Query(
        None, description="Only statistics from games in this season.", examples=[1]
    ),
    stat_definition_id: int | None = Query(
        None, description="Statistic definition ID from /api/lookups.", examples=[1]
    ),
    league_id: int | None = Query(
        None, description="Only statistics from games in this league.", examples=[1]
    ),
    page: int = Query(1, ge=1, description="One-based result page.", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=200, description="Records per page, from 1 to 200.", examples=[20]
    ),
):
    statement = (
        select(PerformanceStatistic)
        .join(Game)
        .join(Season)
        .join(
            StatDefinition,
            PerformanceStatistic.stat_definition_id
            == StatDefinition.stat_definition_id,
        )
        .order_by(Game.game_time.desc(), PerformanceStatistic.performance_statistic_id)
    )
    if q:
        statement = statement.where(
            or_(
                StatDefinition.stat_name.icontains(q, autoescape=True),
                PerformanceStatistic.athlete_id.in_(
                    select(Athlete.athlete_id).where(
                        (Athlete.first_name + " " + Athlete.last_name).icontains(
                            q, autoescape=True
                        )
                    )
                ),
                PerformanceStatistic.team_id.in_(
                    select(Team.team_id).where(
                        Team.team_name.icontains(q, autoescape=True)
                    )
                ),
            )
        )
    for column, value in (
        (PerformanceStatistic.athlete_id, athlete_id),
        (PerformanceStatistic.team_id, team_id),
        (PerformanceStatistic.game_id, game_id),
        (Game.season_id, season_id),
        (PerformanceStatistic.stat_definition_id, stat_definition_id),
        (Season.league_id, league_id),
    ):
        if value is not None:
            statement = statement.where(column == value)
    return page_result(session, statement, statistic_view, page, page_size)


@router.get(
    "/performance-statistics/{statistic_id}",
    tags=["Performance statistics"],
    summary="Get a performance statistic",
    description="""
    Return one recorded value with its definition name and abbreviation, its
    athlete or team subject, and related game/season labels. The definition's
    calculation type is metadata; this endpoint returns the stored value.
    """,
    responses={200: RECORD_RESPONSE, **READ_RESPONSES},
)
def get_statistic(statistic_id: int, session: DB):
    return statistic_view(
        session,
        require_record(session, PerformanceStatistic, statistic_id, "statistic"),
    )


def require_statistic_references(session: Session, body: StatisticWrite) -> None:
    require_record(session, Game, body.game_id, "game")
    require_record(
        session, StatDefinition, body.stat_definition_id, "statistic definition"
    )
    if body.athlete_id is not None:
        require_record(session, Athlete, body.athlete_id, "athlete")
    if body.team_id is not None:
        require_record(session, Team, body.team_id, "team")


@router.post(
    "/performance-statistics",
    tags=["Performance statistics"],
    summary="Record an athlete or team statistic",
    description="""
    Choose a game and statistic definition from `/api/lookups`, then supply
    exactly one of `athlete_id` or `team_id`; leave the other null or omitted.
    The definition must match the game's sport. A team subject must participate
    in that game; an athlete needs an active membership on a participating
    team's season roster on the game's UTC date.

    Each game/definition/subject combination must be unique. Finite negative
    values are allowed because some sports statistics can be negative.
    """,
    status_code=201,
    responses={201: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def create_statistic(
    body: Annotated[StatisticWrite, Body(openapi_examples=STATISTIC_EXAMPLES)],
    session: DB,
):
    require_statistic_references(session, body)
    statistic = PerformanceStatistic(**body.model_dump())
    session.add(statistic)
    save_changes(session)
    return statistic_view(session, statistic)


@router.put(
    "/performance-statistics/{statistic_id}",
    tags=["Performance statistics"],
    summary="Replace a performance statistic's values",
    description="""
    Send the complete statistic payload, including game, definition, value, and
    exactly one subject. Omitted subject fields become null, so include the
    intended athlete or team ID even when changing only the value.

    The same uniqueness, sport, participation, and membership rules as creation
    apply. The whole replacement rolls back if any rule is rejected.
    """,
    responses={200: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def update_statistic(
    statistic_id: int,
    body: Annotated[StatisticWrite, Body(openapi_examples=STATISTIC_EXAMPLES)],
    session: DB,
):
    statistic = require_record(session, PerformanceStatistic, statistic_id, "statistic")
    require_statistic_references(session, body)
    for name, value in body.model_dump().items():
        setattr(statistic, name, value)
    save_changes(session, existing=True)
    return statistic_view(session, statistic)


@router.delete(
    "/performance-statistics/{statistic_id}",
    tags=["Performance statistics"],
    summary="Delete a recorded statistic",
    description="""
    Remove only the selected statistic. Its game, definition, athlete/team,
    and game scores remain. Standings are derived from completed game scores,
    so removing a statistic does not change them.

    Confirm in your client first. Success returns 204 with no response body.
    """,
    status_code=204,
    responses=WRITE_RESPONSES,
)
def delete_statistic(statistic_id: int, session: DB):
    session.delete(
        require_record(session, PerformanceStatistic, statistic_id, "statistic")
    )
    save_changes(session, existing=True)
    return Response(status_code=204)
