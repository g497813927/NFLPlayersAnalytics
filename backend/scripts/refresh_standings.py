"""Refresh all derived standings after deliberate manual database changes."""

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Season
from app.services import recalculate_standings, validate_sports_integrity


def main() -> None:
    with SessionLocal.begin() as session:
        validate_sports_integrity(session)
        seasons = list(session.scalars(select(Season.season_id)))
        recalculate_standings(session, seasons)
    print(f"Refreshed standings for {len(seasons)} seasons.")


if __name__ == "__main__":
    main()
