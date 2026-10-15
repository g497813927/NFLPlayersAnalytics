"""Recalculate standings for the sports prototype."""

from fractions import Fraction
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from ..errors import AppError
from ..models import Game, GameParticipant, Roster, Standing


def recalculate_standings(session: Session, season_ids) -> None:
    """Refresh derived rows inside the caller's transaction; never commit here."""
    for season_id in set(season_ids):
        team_ids = set(
            session.scalars(select(Roster.team_id).where(Roster.season_id == season_id))
        )
        records = {team_id: {"wins": 0, "losses": 0, "ties": 0} for team_id in team_ids}
        completed = session.scalars(
            select(Game).where(Game.season_id == season_id, Game.status == "completed")
        ).all()
        for game in completed:
            entries = session.scalars(
                select(GameParticipant).where(GameParticipant.game_id == game.game_id)
            ).all()
            if len(entries) != 2 or any(p.score is None for p in entries):
                raise AppError(
                    409,
                    "incomplete_result",
                    "A completed game is missing a team or score. Correct it before updating standings.",
                )
            first, second = entries
            for participant, opponent in ((first, second), (second, first)):
                if participant.team_id not in records:
                    raise AppError(
                        409,
                        "missing_roster",
                        "A game team has no roster for this season.",
                    )
                outcome = (
                    "ties"
                    if participant.score == opponent.score
                    else "wins"
                    if participant.score > opponent.score
                    else "losses"
                )
                records[participant.team_id][outcome] += 1
        percentages = {}
        for team_id, record in records.items():
            played = sum(record.values())
            percentages[team_id] = (
                Fraction(2 * record["wins"] + record["ties"], 2 * played)
                if played
                else Fraction(0)
            )
        ranking = {
            value: rank
            for rank, value in enumerate(
                sorted(set(percentages.values()), reverse=True), 1
            )
        }
        session.execute(delete(Standing).where(Standing.season_id == season_id))
        for team_id, record in records.items():
            session.add(
                Standing(
                    team_id=team_id,
                    season_id=season_id,
                    rank=ranking[percentages[team_id]],
                    points=record["wins"] + 0.5 * record["ties"],
                    **record,
                )
            )
    session.flush()
