"""Membership view for the sports prototype."""

from sqlalchemy.orm import Session
from ..models import Athlete, Membership, Roster

from .serialization import row_values
from .roster_view import roster_view


def membership_view(session: Session, membership: Membership) -> dict:
    roster = roster_view(session, session.get(Roster, membership.roster_id))
    athlete = session.get(Athlete, membership.athlete_id)
    return {
        **row_values(membership),
        "athlete_name": f"{athlete.first_name} {athlete.last_name}",
        "team_id": roster["team_id"],
        "team_name": roster["team_name"],
        "season_id": roster["season_id"],
        "season_name": roster["season_name"],
        "roster_label": roster["label"],
    }
