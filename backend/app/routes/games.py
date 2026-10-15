"""Games and atomic home/away participant writes."""

from datetime import date, datetime, time
from typing import Annotated

from fastapi import APIRouter, Body, Query, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..api_docs import LIST_RESPONSES, READ_RESPONSES, WRITE_RESPONSES
from ..errors import AppError
from ..models import Game, GameParticipant, Season, Team, Venue
from ..response_docs import PAGINATED_RESPONSE, RECORD_RESPONSE
from ..request_examples import GAME_EXAMPLES
from ..schemas import GameWrite
from ..services import game_view, require_record
from .common import DB, page_result, save_changes

router = APIRouter()


@router.get(
    "/games",
    tags=["Games"],
    summary="Search schedules and game results",
    description="""
    Search participating team names and combine season, team, league, status,
    and inclusive UTC calendar-date filters. A reversed date range is rejected.
    Return paginated matchups with both participants, scores, venue, and season
    labels, newest game times first. Returned timestamps include UTC timezone.
    """,
    responses={200: PAGINATED_RESPONSE, **LIST_RESPONSES},
)
def list_games(
    session: DB,
    q: str | None = Query(
        None,
        description="Case-insensitive text contained in either participating team's name.",
        examples=["Harbor"],
    ),
    season_id: int | None = Query(
        None, description="Season ID from /api/lookups.", examples=[1]
    ),
    team_id: int | None = Query(
        None,
        description="Games in which this team participates as home or away.",
        examples=[1],
    ),
    league_id: int | None = Query(
        None, description="Games whose season belongs to this league.", examples=[1]
    ),
    status: str | None = Query(
        None,
        description="Exact status: scheduled, in_progress, completed, or cancelled. Unknown values return no matches.",
        examples=["completed"],
    ),
    date_from: date | None = Query(
        None,
        description="Inclusive first UTC calendar date (YYYY-MM-DD).",
        examples=["2026-09-01"],
    ),
    date_to: date | None = Query(
        None,
        description="Inclusive last UTC calendar date (YYYY-MM-DD).",
        examples=["2026-12-31"],
    ),
    page: int = Query(1, ge=1, description="One-based result page.", examples=[1]),
    page_size: int = Query(
        20, ge=1, le=200, description="Records per page, from 1 to 200.", examples=[20]
    ),
):
    statement = select(Game).join(Season).order_by(Game.game_time.desc(), Game.game_id)
    if q:
        statement = statement.where(
            Game.game_id.in_(
                select(GameParticipant.game_id)
                .join(Team)
                .where(Team.team_name.icontains(q, autoescape=True))
            )
        )
    if season_id is not None:
        statement = statement.where(Game.season_id == season_id)
    if team_id is not None:
        statement = statement.where(
            Game.game_id.in_(
                select(GameParticipant.game_id).where(
                    GameParticipant.team_id == team_id
                )
            )
        )
    if league_id is not None:
        statement = statement.where(Season.league_id == league_id)
    if status is not None:
        statement = statement.where(Game.status == status)
    if date_from is not None and date_to is not None and date_from > date_to:
        raise AppError(
            422,
            "invalid_date_range",
            "The start date must be on or before the end date.",
        )
    if date_from is not None:
        statement = statement.where(
            Game.game_time >= datetime.combine(date_from, time.min)
        )
    if date_to is not None:
        statement = statement.where(
            Game.game_time <= datetime.combine(date_to, time.max)
        )
    return page_result(session, statement, game_view, page, page_size)


@router.get(
    "/games/{game_id}",
    tags=["Games"],
    summary="Get a game and its participants",
    description="""
    Return one game with its home and away participants, scores, matchup,
    venue/season labels, and UTC timestamp. Participants are edited together
    through the game PUT endpoint rather than separate participant endpoints.
    """,
    responses={200: RECORD_RESPONSE, **READ_RESPONSES},
)
def get_game(game_id: int, session: DB):
    return game_view(session, require_record(session, Game, game_id, "game"))


def require_game_references(session: Session, body: GameWrite) -> None:
    require_record(session, Season, body.season_id, "season")
    if body.venue_id is not None:
        require_record(session, Venue, body.venue_id, "venue")
    for participant in body.participants:
        require_record(session, Team, participant.team_id, "team")


@router.post(
    "/games",
    tags=["Games"],
    summary="Create a game with home and away teams",
    description="""
    Save the game and exactly two distinct participants atomically: one `home`
    and one `away`. Choose IDs from `/api/lookups`; both teams must belong to
    the season's league and already have rosters for that season.

    The UTC game date must fall within the season. Offset timestamps normalize
    to UTC; timestamps without an offset are treated as UTC. Scores cannot be
    negative, and completed games require both scores. The venue may be null.

    Standings refresh in the same transaction. Any rejected value rolls back
    the game and both participants.
    """,
    status_code=201,
    responses={201: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def create_game(
    body: Annotated[GameWrite, Body(openapi_examples=GAME_EXAMPLES)], session: DB
):
    require_game_references(session, body)
    game = Game(**body.model_dump(exclude={"participants"}))
    session.add(game)
    session.flush()
    for participant in body.participants:
        session.add(GameParticipant(game_id=game.game_id, **participant.model_dump()))
    save_changes(session, [body.season_id])
    return game_view(session, game)


@router.put(
    "/games/{game_id}",
    tags=["Games"],
    summary="Replace a game and its two participants",
    description="""
    Send the complete game payload and both participants, even when only changing
    a score. This replaces all editable game values and the participant list in
    one transaction; an omitted venue or participant score becomes null.

    The same season, roster, date, and score rules as creation apply. Participant
    or date changes are rejected if they would invalidate existing statistics.
    Both old and new seasons' standings refresh when relevant. A rejected
    replacement leaves the previous game and participants intact.
    """,
    responses={200: RECORD_RESPONSE, **WRITE_RESPONSES},
)
def update_game(
    game_id: int,
    body: Annotated[GameWrite, Body(openapi_examples=GAME_EXAMPLES)],
    session: DB,
):
    game = require_record(session, Game, game_id, "game")
    require_game_references(session, body)
    season_ids = [game.season_id, body.season_id]
    for name, value in body.model_dump(exclude={"participants"}).items():
        setattr(game, name, value)
    session.execute(delete(GameParticipant).where(GameParticipant.game_id == game_id))
    for participant in body.participants:
        session.add(GameParticipant(game_id=game_id, **participant.model_dump()))
    save_changes(session, season_ids, existing=True)
    return game_view(session, game)


@router.delete(
    "/games/{game_id}",
    tags=["Games"],
    summary="Delete a game and its recorded statistics",
    description="""
    Delete a game and cascade to its participants and performance statistics.
    Refresh the affected season's standings in the same transaction; teams,
    athletes, rosters, seasons, and venues remain.

    Confirm these consequences in your client before sending the request.
    Success returns 204 with no response body.
    """,
    status_code=204,
    responses=WRITE_RESPONSES,
)
def delete_game(game_id: int, session: DB):
    game = require_record(session, Game, game_id, "game")
    season_id = game.season_id
    session.delete(game)
    save_changes(session, [season_id], existing=True)
    return Response(status_code=204)
