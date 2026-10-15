"""Validate sports integrity for the sports prototype."""

from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..errors import AppError
from ..models import (
    Game,
    GameParticipant,
    League,
    Membership,
    PerformanceStatistic,
    Roster,
    Season,
    StatDefinition,
    Team,
)


def validate_sports_integrity(session: Session, status_code: int = 422) -> None:
    """Validate cross-table rules after a flush, before committing any mutation.

    Checking the small prototype dataset together also prevents edits to roster
    dates, participants or league assignments from invalidating existing stats.
    Ordinary keys, uniqueness and row checks remain database constraints.
    """
    leagues = {r.league_id: r for r in session.scalars(select(League))}
    seasons = {r.season_id: r for r in session.scalars(select(Season))}
    teams = {r.team_id: r for r in session.scalars(select(Team))}
    rosters = {r.roster_id: r for r in session.scalars(select(Roster))}
    games = {r.game_id: r for r in session.scalars(select(Game))}
    definitions = {
        r.stat_definition_id: r for r in session.scalars(select(StatDefinition))
    }
    participants = defaultdict(list)
    memberships = defaultdict(list)
    season_teams = {(r.season_id, r.team_id) for r in rosters.values()}

    def reject(message: str) -> None:
        raise AppError(status_code, "sports_rule_conflict", message)

    for roster in rosters.values():
        if teams[roster.team_id].league_id != seasons[roster.season_id].league_id:
            reject("A roster's team and season must belong to the same league.")
    for membership in session.scalars(select(Membership)):
        roster = rosters[membership.roster_id]
        season = seasons[roster.season_id]
        if not season.start_date <= membership.start_date <= season.end_date:
            reject("A membership must start within its roster's season.")
        if (
            membership.end_date is not None
            and not membership.start_date <= membership.end_date <= season.end_date
        ):
            reject(
                "A membership must end between its start date and the season's end date."
            )
        memberships[membership.athlete_id].append(membership)
    for participant in session.scalars(select(GameParticipant)):
        participants[participant.game_id].append(participant)
    for game in games.values():
        season = seasons[game.season_id]
        if not season.start_date <= game.game_time.date() <= season.end_date:
            reject("A game's date must fall within the selected season.")
        entries = participants[game.game_id]
        if len(entries) != 2 or {p.participant_role for p in entries} != {
            "home",
            "away",
        }:
            reject("Each game needs one home team and one away team.")
        for participant in entries:
            if teams[participant.team_id].league_id != season.league_id:
                reject("Both game teams must belong to the season's league.")
            if (game.season_id, participant.team_id) not in season_teams:
                reject(
                    "Each game team needs a roster for the selected season. Add that roster before scheduling the game."
                )
            if game.status == "completed" and participant.score is None:
                reject("Completed games need a score for both teams.")
    for statistic in session.scalars(select(PerformanceStatistic)):
        game = games[statistic.game_id]
        season = seasons[game.season_id]
        if (
            definitions[statistic.stat_definition_id].sport_id
            != leagues[season.league_id].sport_id
        ):
            reject("The statistic's definition must match the game's sport.")
        participant_ids = {p.team_id for p in participants[game.game_id]}
        if statistic.team_id is not None and statistic.team_id not in participant_ids:
            reject(
                "A team statistic must describe one of the teams playing in its game."
            )
        if statistic.athlete_id is not None:
            active = any(
                rosters[m.roster_id].season_id == game.season_id
                and rosters[m.roster_id].team_id in participant_ids
                and m.start_date <= game.game_time.date()
                and (m.end_date is None or m.end_date >= game.game_time.date())
                for m in memberships[statistic.athlete_id]
            )
            if not active:
                reject(
                    "An athlete statistic needs an active membership on a participating team on the game's date. This change would leave a statistic without that membership."
                )
