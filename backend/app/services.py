"""Business rules and small view helpers for the seeded sports prototype."""

from collections import defaultdict
from datetime import timezone
from fractions import Fraction

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .errors import AppError
from .models import (
    Athlete, Game, GameParticipant, League, Membership, PerformanceStatistic,
    Roster, Season, Sport, Standing, StatDefinition, Team, Venue,
)


def require_record(session: Session, model, record_id: int, label: str):
    record = session.get(model, record_id)
    if record is None:
        raise AppError(404, "not_found", f"The selected {label} could not be found. Refresh the page and try again.")
    return record


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
    definitions = {r.stat_definition_id: r for r in session.scalars(select(StatDefinition))}
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
        if membership.end_date is not None and not membership.start_date <= membership.end_date <= season.end_date:
            reject("A membership must end between its start date and the season's end date.")
        memberships[membership.athlete_id].append(membership)
    for participant in session.scalars(select(GameParticipant)):
        participants[participant.game_id].append(participant)
    for game in games.values():
        season = seasons[game.season_id]
        if not season.start_date <= game.game_time.date() <= season.end_date:
            reject("A game's date must fall within the selected season.")
        entries = participants[game.game_id]
        if len(entries) != 2 or {p.participant_role for p in entries} != {"home", "away"}:
            reject("Each game needs one home team and one away team.")
        for participant in entries:
            if teams[participant.team_id].league_id != season.league_id:
                reject("Both game teams must belong to the season's league.")
            if (game.season_id, participant.team_id) not in season_teams:
                reject("Each game team needs a roster for the selected season. Add that roster before scheduling the game.")
            if game.status == "completed" and participant.score is None:
                reject("Completed games need a score for both teams.")
    for statistic in session.scalars(select(PerformanceStatistic)):
        game = games[statistic.game_id]
        season = seasons[game.season_id]
        if definitions[statistic.stat_definition_id].sport_id != leagues[season.league_id].sport_id:
            reject("The statistic's definition must match the game's sport.")
        participant_ids = {p.team_id for p in participants[game.game_id]}
        if statistic.team_id is not None and statistic.team_id not in participant_ids:
            reject("A team statistic must describe one of the teams playing in its game.")
        if statistic.athlete_id is not None:
            active = any(
                rosters[m.roster_id].season_id == game.season_id
                and rosters[m.roster_id].team_id in participant_ids
                and m.start_date <= game.game_time.date()
                and (m.end_date is None or m.end_date >= game.game_time.date())
                for m in memberships[statistic.athlete_id]
            )
            if not active:
                reject("An athlete statistic needs an active membership on a participating team on the game's date. This change would leave a statistic without that membership.")


def recalculate_standings(session: Session, season_ids) -> None:
    """Refresh derived rows inside the caller's transaction; never commit here."""
    for season_id in set(season_ids):
        team_ids = set(session.scalars(select(Roster.team_id).where(Roster.season_id == season_id)))
        records = {team_id: {"wins": 0, "losses": 0, "ties": 0} for team_id in team_ids}
        completed = session.scalars(select(Game).where(Game.season_id == season_id, Game.status == "completed")).all()
        for game in completed:
            entries = session.scalars(select(GameParticipant).where(GameParticipant.game_id == game.game_id)).all()
            if len(entries) != 2 or any(p.score is None for p in entries):
                raise AppError(409, "incomplete_result", "A completed game is missing a team or score. Correct it before updating standings.")
            first, second = entries
            for participant, opponent in ((first, second), (second, first)):
                if participant.team_id not in records:
                    raise AppError(409, "missing_roster", "A game team has no roster for this season.")
                outcome = "ties" if participant.score == opponent.score else "wins" if participant.score > opponent.score else "losses"
                records[participant.team_id][outcome] += 1
        percentages = {}
        for team_id, record in records.items():
            played = sum(record.values())
            percentages[team_id] = Fraction(2 * record["wins"] + record["ties"], 2 * played) if played else Fraction(0)
        ranking = {value: rank for rank, value in enumerate(sorted(set(percentages.values()), reverse=True), 1)}
        session.execute(delete(Standing).where(Standing.season_id == season_id))
        for team_id, record in records.items():
            session.add(Standing(team_id=team_id, season_id=season_id, rank=ranking[percentages[team_id]],
                                 points=record["wins"] + 0.5 * record["ties"], **record))
    session.flush()


def row_values(row) -> dict:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


def team_view(session: Session, team: Team) -> dict:
    league = session.get(League, team.league_id)
    sport = session.get(Sport, league.sport_id)
    return {**row_values(team), "league_name": league.league_name, "sport_id": sport.sport_id, "sport_name": sport.sport_name}


def athlete_view(session: Session, athlete: Athlete) -> dict:
    name = f"{athlete.first_name} {athlete.last_name}"
    return {**row_values(athlete), "athlete_name": name, "full_name": name}


def roster_view(session: Session, roster: Roster) -> dict:
    team = session.get(Team, roster.team_id)
    season = session.get(Season, roster.season_id)
    return {**row_values(roster), "team_name": team.team_name, "season_name": season.season_name,
            "league_id": season.league_id, "label": f"{team.team_name} · {season.season_name}"}


def membership_view(session: Session, membership: Membership) -> dict:
    roster = roster_view(session, session.get(Roster, membership.roster_id))
    athlete = session.get(Athlete, membership.athlete_id)
    return {**row_values(membership), "athlete_name": f"{athlete.first_name} {athlete.last_name}",
            "team_id": roster["team_id"], "team_name": roster["team_name"], "season_id": roster["season_id"],
            "season_name": roster["season_name"], "roster_label": roster["label"]}


def game_view(session: Session, game: Game) -> dict:
    season = session.get(Season, game.season_id)
    venue = session.get(Venue, game.venue_id) if game.venue_id is not None else None
    entries = session.scalars(select(GameParticipant).where(GameParticipant.game_id == game.game_id).order_by(GameParticipant.participant_role)).all()
    participants = [{**row_values(p), "team_name": session.get(Team, p.team_id).team_name} for p in entries]
    home = next((p for p in participants if p["participant_role"] == "home"), None)
    away = next((p for p in participants if p["participant_role"] == "away"), None)
    matchup = f"{away['team_name']} at {home['team_name']}" if home and away else "Teams pending"
    return {**row_values(game), "game_time": game.game_time.replace(tzinfo=timezone.utc),
            "season_name": season.season_name, "league_id": season.league_id,
            "venue_name": venue.venue_name if venue else None, "participants": participants,
            "matchup": matchup, "game_label": f"{matchup} · {game.game_time.date().isoformat()}",
            "home_team_name": home["team_name"] if home else None, "away_team_name": away["team_name"] if away else None,
            "home_score": home["score"] if home else None, "away_score": away["score"] if away else None}


def statistic_view(session: Session, statistic: PerformanceStatistic) -> dict:
    definition = session.get(StatDefinition, statistic.stat_definition_id)
    game = game_view(session, session.get(Game, statistic.game_id))
    athlete = session.get(Athlete, statistic.athlete_id) if statistic.athlete_id is not None else None
    team = session.get(Team, statistic.team_id) if statistic.team_id is not None else None
    athlete_name = f"{athlete.first_name} {athlete.last_name}" if athlete else None
    return {**row_values(statistic), "stat_name": definition.stat_name, "abbreviation": definition.abbreviation,
            "calc_type": definition.calc_type, "sport_id": definition.sport_id, "athlete_name": athlete_name,
            "team_name": team.team_name if team else None, "subject_name": athlete_name or (team.team_name if team else None),
            "season_id": game["season_id"], "season_name": game["season_name"], "game_time": game["game_time"],
            "game_label": game["game_label"], "matchup": game["matchup"]}


def standing_view(session: Session, standing: Standing) -> dict:
    team = session.get(Team, standing.team_id)
    season = session.get(Season, standing.season_id)
    played = standing.wins + standing.losses + standing.ties
    return {**row_values(standing), "team_name": team.team_name, "season_name": season.season_name,
            "league_id": season.league_id, "games_played": played,
            "win_percentage": (standing.wins + 0.5 * standing.ties) / played if played else 0.0}
