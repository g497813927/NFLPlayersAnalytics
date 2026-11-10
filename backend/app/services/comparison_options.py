"""Offer only teams and athletes belonging to the selected season's rosters."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Athlete, League, Membership, Roster, Season, Team
from ..schemas.comparison_options import ComparisonOptions
from ..schemas.comparison_subject import ComparisonSubject
from .records import require_record


def comparison_options(session: Session, season_id: int) -> ComparisonOptions:
    season = require_record(session, Season, season_id, "season")
    league = require_record(session, League, season.league_id, "league")
    teams = session.scalars(
        select(Team)
        .join(Roster)
        .where(Roster.season_id == season_id)
        .order_by(Team.team_name, Team.team_id)
    ).all()
    rows = session.execute(
        select(Athlete, Team.team_name, Membership.position)
        .join(Membership, Membership.athlete_id == Athlete.athlete_id)
        .join(Roster, Roster.roster_id == Membership.roster_id)
        .join(Team, Team.team_id == Roster.team_id)
        .where(Roster.season_id == season_id)
        .order_by(Athlete.last_name, Athlete.first_name, Athlete.athlete_id)
    )
    athletes: dict[int, ComparisonSubject] = {}
    contexts: dict[int, set[str]] = {}
    for athlete, team_name, position in rows:
        subject = athletes.setdefault(
            athlete.athlete_id,
            ComparisonSubject(
                id=athlete.athlete_id,
                name=f"{athlete.first_name} {athlete.last_name}",
                detail="",
            ),
        )
        contexts.setdefault(athlete.athlete_id, set()).add(f"{position} · {team_name}")
        if position not in subject.positions:
            subject.positions.append(position)
    for subject in athletes.values():
        subject.detail = "; ".join(sorted(contexts[subject.id]))
        subject.positions.sort()
    return ComparisonOptions(
        season_id=season_id,
        season_name=season.season_name,
        league_name=league.league_name,
        teams=[
            ComparisonSubject(id=team.team_id, name=team.team_name, detail=team.city)
            for team in teams
        ],
        athletes=list(athletes.values()),
    )
