"""Small, explicit CRUD endpoints used by the React prototype."""

from datetime import date, datetime, time
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from .database import get_session
from .errors import AppError
from .models import (
    Athlete, Game, GameParticipant, League, Membership, PerformanceStatistic,
    Roster, Season, Sport, Standing, StatDefinition, Team, Venue,
)
from .schemas import AthleteWrite, GameWrite, MembershipWrite, RosterWrite, StatisticWrite, TeamWrite
from .services import (
    athlete_view, game_view, membership_view, recalculate_standings, require_record,
    roster_view, row_values, standing_view, statistic_view, team_view, validate_sports_integrity,
)

router = APIRouter(prefix="/api")
DB = Annotated[Session, Depends(get_session)]


def page_result(session: Session, statement, view, page: int, page_size: int) -> dict:
    total = session.scalar(select(func.count()).select_from(statement.order_by(None).subquery()))
    rows = session.scalars(statement.offset((page - 1) * page_size).limit(page_size)).all()
    return {"items": [view(session, row) for row in rows], "total": total, "page": page, "page_size": page_size}


def save_changes(session: Session, season_ids=(), *, existing: bool = False) -> None:
    session.flush()
    validate_sports_integrity(session, status_code=409 if existing else 422)
    if season_ids:
        recalculate_standings(session, season_ids)
    session.commit()


@router.get("/overview")
def overview(session: DB):
    counts = {name: session.scalar(select(func.count()).select_from(model)) for name, model in (
        ("sports", Sport), ("leagues", League), ("teams", Team), ("athletes", Athlete),
        ("rosters", Roster), ("memberships", Membership), ("games", Game),
        ("performance_statistics", PerformanceStatistic),
    )}
    recent = session.scalars(select(Game).where(Game.status == "completed").order_by(Game.game_time.desc()).limit(5))
    return {"counts": counts, "recent_games": [game_view(session, game) for game in recent]}


@router.get("/lookups")
def lookups(session: DB):
    leagues = session.scalars(select(League).order_by(League.league_name)).all()
    seasons = session.scalars(select(Season).order_by(Season.start_date.desc())).all()
    definitions = session.scalars(select(StatDefinition).order_by(StatDefinition.stat_name)).all()
    return {
        "sports": [row_values(row) for row in session.scalars(select(Sport).order_by(Sport.sport_name))],
        "leagues": [{**row_values(row), "sport_name": session.get(Sport, row.sport_id).sport_name} for row in leagues],
        "seasons": [{**row_values(row), "league_name": session.get(League, row.league_id).league_name,
                     "sport_id": session.get(League, row.league_id).sport_id} for row in seasons],
        "venues": [row_values(row) for row in session.scalars(select(Venue).order_by(Venue.venue_name))],
        "stat_definitions": [{**row_values(row), "sport_name": session.get(Sport, row.sport_id).sport_name} for row in definitions],
        "teams": [team_view(session, row) for row in session.scalars(select(Team).order_by(Team.team_name))],
        "athletes": [athlete_view(session, row) for row in session.scalars(select(Athlete).order_by(Athlete.last_name, Athlete.first_name))],
        "rosters": [roster_view(session, row) for row in session.scalars(select(Roster).order_by(Roster.roster_id))],
        "games": [game_view(session, row) for row in session.scalars(select(Game).order_by(Game.game_time.desc()))],
    }


@router.get("/teams")
def list_teams(session: DB, q: str | None = None, league_id: int | None = None, season_id: int | None = None,
               page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    statement = select(Team).join(League).order_by(Team.team_name, Team.team_id)
    if q:
        statement = statement.where(or_(Team.team_name.icontains(q, autoescape=True), Team.city.icontains(q, autoescape=True)))
    if league_id is not None:
        statement = statement.where(Team.league_id == league_id)
    if season_id is not None:
        statement = statement.where(Team.team_id.in_(select(Roster.team_id).where(Roster.season_id == season_id)))
    return page_result(session, statement, team_view, page, page_size)


@router.get("/teams/{team_id}")
def get_team(team_id: int, session: DB):
    team = require_record(session, Team, team_id, "team")
    rosters = session.scalars(select(Roster).where(Roster.team_id == team_id).order_by(Roster.season_id)).all()
    memberships = session.scalars(select(Membership).join(Roster).where(Roster.team_id == team_id).order_by(Membership.start_date))
    return {**team_view(session, team), "rosters": [roster_view(session, row) for row in rosters],
            "memberships": [membership_view(session, row) for row in memberships]}


@router.post("/teams", status_code=201)
def create_team(body: TeamWrite, session: DB):
    require_record(session, League, body.league_id, "league")
    team = Team(**body.model_dump())
    session.add(team)
    save_changes(session)
    return team_view(session, team)


@router.put("/teams/{team_id}")
def update_team(team_id: int, body: TeamWrite, session: DB):
    team = require_record(session, Team, team_id, "team")
    require_record(session, League, body.league_id, "league")
    for name, value in body.model_dump().items():
        setattr(team, name, value)
    save_changes(session, existing=True)
    return team_view(session, team)


@router.delete("/teams/{team_id}", status_code=204)
def delete_team(team_id: int, session: DB):
    session.delete(require_record(session, Team, team_id, "team"))
    save_changes(session, existing=True)
    return Response(status_code=204)


@router.get("/athletes")
def list_athletes(session: DB, q: str | None = None, team_id: int | None = None, season_id: int | None = None,
                  league_id: int | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    statement = select(Athlete).order_by(Athlete.last_name, Athlete.first_name, Athlete.athlete_id)
    if q:
        statement = statement.where((Athlete.first_name + " " + Athlete.last_name).icontains(q, autoescape=True))
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


@router.get("/athletes/{athlete_id}")
def get_athlete(athlete_id: int, session: DB):
    athlete = require_record(session, Athlete, athlete_id, "athlete")
    memberships = session.scalars(select(Membership).where(Membership.athlete_id == athlete_id).order_by(Membership.start_date.desc()))
    statistics = session.scalars(select(PerformanceStatistic).join(Game).where(PerformanceStatistic.athlete_id == athlete_id).order_by(Game.game_time.desc()))
    return {**athlete_view(session, athlete), "memberships": [membership_view(session, row) for row in memberships],
            "statistics": [statistic_view(session, row) for row in statistics]}


@router.post("/athletes", status_code=201)
def create_athlete(body: AthleteWrite, session: DB):
    athlete = Athlete(**body.model_dump())
    session.add(athlete)
    save_changes(session)
    return athlete_view(session, athlete)


@router.put("/athletes/{athlete_id}")
def update_athlete(athlete_id: int, body: AthleteWrite, session: DB):
    athlete = require_record(session, Athlete, athlete_id, "athlete")
    for name, value in body.model_dump().items():
        setattr(athlete, name, value)
    save_changes(session, existing=True)
    return athlete_view(session, athlete)


@router.delete("/athletes/{athlete_id}", status_code=204)
def delete_athlete(athlete_id: int, session: DB):
    session.delete(require_record(session, Athlete, athlete_id, "athlete"))
    save_changes(session, existing=True)
    return Response(status_code=204)


@router.get("/rosters")
def list_rosters(session: DB, q: str | None = None, team_id: int | None = None, season_id: int | None = None,
                 league_id: int | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    statement = select(Roster).join(Team).join(Season, Roster.season_id == Season.season_id).order_by(Season.start_date.desc(), Team.team_name)
    if q:
        statement = statement.where(or_(Team.team_name.icontains(q, autoescape=True), Season.season_name.icontains(q, autoescape=True)))
    if team_id is not None:
        statement = statement.where(Roster.team_id == team_id)
    if season_id is not None:
        statement = statement.where(Roster.season_id == season_id)
    if league_id is not None:
        statement = statement.where(Team.league_id == league_id)
    return page_result(session, statement, roster_view, page, page_size)


@router.get("/rosters/{roster_id}")
def get_roster(roster_id: int, session: DB):
    roster = require_record(session, Roster, roster_id, "roster")
    memberships = session.scalars(select(Membership).where(Membership.roster_id == roster_id))
    return {**roster_view(session, roster), "memberships": [membership_view(session, row) for row in memberships]}


@router.post("/rosters", status_code=201)
def create_roster(body: RosterWrite, session: DB):
    require_record(session, Team, body.team_id, "team")
    require_record(session, Season, body.season_id, "season")
    roster = Roster(**body.model_dump())
    session.add(roster)
    save_changes(session, [body.season_id])
    return roster_view(session, roster)


@router.put("/rosters/{roster_id}")
def update_roster(roster_id: int, body: RosterWrite, session: DB):
    roster = require_record(session, Roster, roster_id, "roster")
    require_record(session, Team, body.team_id, "team")
    require_record(session, Season, body.season_id, "season")
    season_ids = [roster.season_id, body.season_id]
    for name, value in body.model_dump().items():
        setattr(roster, name, value)
    save_changes(session, season_ids, existing=True)
    return roster_view(session, roster)


@router.delete("/rosters/{roster_id}", status_code=204)
def delete_roster(roster_id: int, session: DB):
    roster = require_record(session, Roster, roster_id, "roster")
    season_id = roster.season_id
    session.delete(roster)
    save_changes(session, [season_id], existing=True)
    return Response(status_code=204)


@router.get("/memberships")
def list_memberships(session: DB, q: str | None = None, roster_id: int | None = None, athlete_id: int | None = None,
                     team_id: int | None = None, season_id: int | None = None, league_id: int | None = None,
                     page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    statement = select(Membership).join(Roster).join(Team).join(Athlete, Membership.athlete_id == Athlete.athlete_id).order_by(Athlete.last_name, Membership.membership_id)
    if q:
        statement = statement.where(or_((Athlete.first_name + " " + Athlete.last_name).icontains(q, autoescape=True), Team.team_name.icontains(q, autoescape=True)))
    for column, value in ((Membership.roster_id, roster_id), (Membership.athlete_id, athlete_id), (Roster.team_id, team_id),
                          (Roster.season_id, season_id), (Team.league_id, league_id)):
        if value is not None:
            statement = statement.where(column == value)
    return page_result(session, statement, membership_view, page, page_size)


@router.get("/memberships/{membership_id}")
def get_membership(membership_id: int, session: DB):
    return membership_view(session, require_record(session, Membership, membership_id, "membership"))


@router.post("/memberships", status_code=201)
def create_membership(body: MembershipWrite, session: DB):
    require_record(session, Roster, body.roster_id, "roster")
    require_record(session, Athlete, body.athlete_id, "athlete")
    membership = Membership(**body.model_dump())
    session.add(membership)
    save_changes(session)
    return membership_view(session, membership)


@router.put("/memberships/{membership_id}")
def update_membership(membership_id: int, body: MembershipWrite, session: DB):
    membership = require_record(session, Membership, membership_id, "membership")
    require_record(session, Roster, body.roster_id, "roster")
    require_record(session, Athlete, body.athlete_id, "athlete")
    for name, value in body.model_dump().items():
        setattr(membership, name, value)
    save_changes(session, existing=True)
    return membership_view(session, membership)


@router.delete("/memberships/{membership_id}", status_code=204)
def delete_membership(membership_id: int, session: DB):
    session.delete(require_record(session, Membership, membership_id, "membership"))
    save_changes(session, existing=True)
    return Response(status_code=204)


@router.get("/games")
def list_games(session: DB, q: str | None = None, season_id: int | None = None, team_id: int | None = None,
               league_id: int | None = None, status: str | None = None,
               date_from: date | None = None, date_to: date | None = None,
               page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    statement = select(Game).join(Season).order_by(Game.game_time.desc(), Game.game_id)
    if q:
        statement = statement.where(Game.game_id.in_(select(GameParticipant.game_id).join(Team).where(Team.team_name.icontains(q, autoescape=True))))
    if season_id is not None:
        statement = statement.where(Game.season_id == season_id)
    if team_id is not None:
        statement = statement.where(Game.game_id.in_(select(GameParticipant.game_id).where(GameParticipant.team_id == team_id)))
    if league_id is not None:
        statement = statement.where(Season.league_id == league_id)
    if status is not None:
        statement = statement.where(Game.status == status)
    if date_from is not None and date_to is not None and date_from > date_to:
        raise AppError(422, "invalid_date_range", "The start date must be on or before the end date.")
    if date_from is not None:
        statement = statement.where(Game.game_time >= datetime.combine(date_from, time.min))
    if date_to is not None:
        statement = statement.where(Game.game_time <= datetime.combine(date_to, time.max))
    return page_result(session, statement, game_view, page, page_size)


@router.get("/games/{game_id}")
def get_game(game_id: int, session: DB):
    return game_view(session, require_record(session, Game, game_id, "game"))


def require_game_references(session: Session, body: GameWrite) -> None:
    require_record(session, Season, body.season_id, "season")
    if body.venue_id is not None:
        require_record(session, Venue, body.venue_id, "venue")
    for participant in body.participants:
        require_record(session, Team, participant.team_id, "team")


@router.post("/games", status_code=201)
def create_game(body: GameWrite, session: DB):
    require_game_references(session, body)
    game = Game(**body.model_dump(exclude={"participants"}))
    session.add(game)
    session.flush()
    for participant in body.participants:
        session.add(GameParticipant(game_id=game.game_id, **participant.model_dump()))
    save_changes(session, [body.season_id])
    return game_view(session, game)


@router.put("/games/{game_id}")
def update_game(game_id: int, body: GameWrite, session: DB):
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


@router.delete("/games/{game_id}", status_code=204)
def delete_game(game_id: int, session: DB):
    game = require_record(session, Game, game_id, "game")
    season_id = game.season_id
    session.delete(game)
    save_changes(session, [season_id], existing=True)
    return Response(status_code=204)


@router.get("/performance-statistics")
def list_statistics(session: DB, q: str | None = None, athlete_id: int | None = None, team_id: int | None = None,
                     game_id: int | None = None, season_id: int | None = None, stat_definition_id: int | None = None,
                     league_id: int | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    statement = select(PerformanceStatistic).join(Game).join(Season).join(StatDefinition, PerformanceStatistic.stat_definition_id == StatDefinition.stat_definition_id).order_by(Game.game_time.desc(), PerformanceStatistic.performance_statistic_id)
    if q:
        statement = statement.where(or_(
            StatDefinition.stat_name.icontains(q, autoescape=True),
            PerformanceStatistic.athlete_id.in_(select(Athlete.athlete_id).where((Athlete.first_name + " " + Athlete.last_name).icontains(q, autoescape=True))),
            PerformanceStatistic.team_id.in_(select(Team.team_id).where(Team.team_name.icontains(q, autoescape=True))),
        ))
    for column, value in ((PerformanceStatistic.athlete_id, athlete_id), (PerformanceStatistic.team_id, team_id),
                          (PerformanceStatistic.game_id, game_id), (Game.season_id, season_id),
                          (PerformanceStatistic.stat_definition_id, stat_definition_id), (Season.league_id, league_id)):
        if value is not None:
            statement = statement.where(column == value)
    return page_result(session, statement, statistic_view, page, page_size)


@router.get("/performance-statistics/{statistic_id}")
def get_statistic(statistic_id: int, session: DB):
    return statistic_view(session, require_record(session, PerformanceStatistic, statistic_id, "statistic"))


def require_statistic_references(session: Session, body: StatisticWrite) -> None:
    require_record(session, Game, body.game_id, "game")
    require_record(session, StatDefinition, body.stat_definition_id, "statistic definition")
    if body.athlete_id is not None:
        require_record(session, Athlete, body.athlete_id, "athlete")
    if body.team_id is not None:
        require_record(session, Team, body.team_id, "team")


@router.post("/performance-statistics", status_code=201)
def create_statistic(body: StatisticWrite, session: DB):
    require_statistic_references(session, body)
    statistic = PerformanceStatistic(**body.model_dump())
    session.add(statistic)
    save_changes(session)
    return statistic_view(session, statistic)


@router.put("/performance-statistics/{statistic_id}")
def update_statistic(statistic_id: int, body: StatisticWrite, session: DB):
    statistic = require_record(session, PerformanceStatistic, statistic_id, "statistic")
    require_statistic_references(session, body)
    for name, value in body.model_dump().items():
        setattr(statistic, name, value)
    save_changes(session, existing=True)
    return statistic_view(session, statistic)


@router.delete("/performance-statistics/{statistic_id}", status_code=204)
def delete_statistic(statistic_id: int, session: DB):
    session.delete(require_record(session, PerformanceStatistic, statistic_id, "statistic"))
    save_changes(session, existing=True)
    return Response(status_code=204)


@router.get("/standings")
def list_standings(session: DB, q: str | None = None, season_id: int | None = None, league_id: int | None = None,
                   team_id: int | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=200)):
    statement = select(Standing).join(Team).join(Season, Standing.season_id == Season.season_id).order_by(Season.start_date.desc(), Standing.rank, Team.team_name)
    if q:
        statement = statement.where(Team.team_name.icontains(q, autoescape=True))
    if season_id is not None:
        statement = statement.where(Standing.season_id == season_id)
    if league_id is not None:
        statement = statement.where(Season.league_id == league_id)
    if team_id is not None:
        statement = statement.where(Standing.team_id == team_id)
    return page_result(session, statement, standing_view, page, page_size)
