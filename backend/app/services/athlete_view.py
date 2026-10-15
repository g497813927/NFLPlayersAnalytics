"""Athlete view for the sports prototype."""

from sqlalchemy.orm import Session
from ..models import Athlete

from .serialization import row_values


def athlete_view(session: Session, athlete: Athlete) -> dict:
    name = f"{athlete.first_name} {athlete.last_name}"
    return {**row_values(athlete), "athlete_name": name, "full_name": name}
