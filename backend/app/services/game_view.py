"""Game view for the sports prototype."""

from datetime import timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import Game, GameParticipant, Season, Team, Venue

from .serialization import row_values


def game_view(session: Session, game: Game) -> dict:
    season = session.get(Season, game.season_id)
    venue = session.get(Venue, game.venue_id) if game.venue_id is not None else None
    entries = session.scalars(
        select(GameParticipant)
        .where(GameParticipant.game_id == game.game_id)
        .order_by(GameParticipant.participant_role)
    ).all()
    participants = [
        {**row_values(p), "team_name": session.get(Team, p.team_id).team_name}
        for p in entries
    ]
    home = next((p for p in participants if p["participant_role"] == "home"), None)
    away = next((p for p in participants if p["participant_role"] == "away"), None)
    matchup = (
        f"{away['team_name']} at {home['team_name']}"
        if home and away
        else "Teams pending"
    )
    return {
        **row_values(game),
        "game_time": game.game_time.replace(tzinfo=timezone.utc),
        "season_name": season.season_name,
        "league_id": season.league_id,
        "venue_name": venue.venue_name if venue else None,
        "participants": participants,
        "matchup": matchup,
        "game_label": f"{matchup} · {game.game_time.date().isoformat()}",
        "home_team_name": home["team_name"] if home else None,
        "away_team_name": away["team_name"] if away else None,
        "home_score": home["score"] if home else None,
        "away_score": away["score"] if away else None,
    }
