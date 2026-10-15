"""Load deterministic fictional football data into an initialized, empty schema."""

from __future__ import annotations

import random
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    Athlete, Base, DataImport, Favorite, Game, GameParticipant, League,
    Membership, PerformanceStatistic, Roster, SavedComparison, Season, Sport,
    StatDefinition, Team, User, Venue,
)

SEED = 5614
FIXTURE_TIMESTAMP = datetime(2026, 8, 15, 12, 0)


def row_counts(session: Session) -> dict[str, int]:
    return {
        table.name: session.scalar(select(func.count()).select_from(table)) or 0
        for table in Base.metadata.sorted_tables
    }


def seed_data(session: Session) -> None:
    """Populate within the caller's transaction; never clear existing data."""
    if any(row_counts(session).values()):
        raise ValueError("Seeding requires empty tables. Use init_db --reset to rebuild the demo.")
    rng = random.Random(SEED)
    session.add(Sport(sport_id=1, sport_name="American Football"))
    session.add_all([
        User(user_id=i, email=f"{'.'.join(name.lower().split())}@example.invalid", display_name=name, role=role)
        for i, (name, role) in enumerate([
            ("Demo Fan", "fan"), ("Rowan Analyst", "analyst"), ("Avery Manager", "admin"),
            ("Morgan Scout", "analyst"), ("Casey Supporter", "fan"),
        ], 1)
    ])
    session.flush()
    session.add(League(league_id=1, league_name="Frontier Football League", country="United States", sport_id=1))
    session.flush()

    cities = ["Alder Bay", "Briar Glen", "Cedar Reach", "Dawn Harbor", "Elm Ridge", "Fern Valley", "Granite Cove", "Hazel Falls", "Iron Meadow", "Juniper Point", "Kestrel Hills", "Laurel Creek", "Maple Shore", "North Summit", "Oak Haven", "Pine Crossing", "Quartz Bluff", "River Hollow", "Silver Grove", "Willow Bend"]
    mascots = ["Foxes", "Owls", "Bears", "Falcons", "Stags", "Wolves", "Ravens", "Hawks", "Bison", "Otters", "Eagles", "Badgers", "Panthers", "Lynx", "Herons", "Mustangs", "Condors", "Bobcats", "Coyotes", "Ospreys"]
    session.add_all([Team(team_id=i + 1, team_name=f"{city} {mascots[i]}", city=city, league_id=1) for i, city in enumerate(cities)])
    session.add_all([Venue(venue_id=i + 1, venue_name=f"{cities[i * 2]} Community Field", city=cities[i * 2]) for i in range(10)])
    first_names = ["Alden", "Bennett", "Corin", "Dorian", "Ellis", "Finley", "Galen", "Hollis", "Ira", "Jules"]
    last_names = ["Ashford", "Brookvale", "Crestwood", "Dunridge", "Evermere", "Fairholt", "Glenbrook", "Hartwell", "Ivydale", "Junewick"]
    session.add_all([
        Athlete(athlete_id=i + 1, first_name=first_names[i // 10], last_name=last_names[i % 10], nationality="United States")
        for i in range(100)
    ])
    session.add_all([
        Season(season_id=i + 1, season_name=str(year), start_date=date(year, 8, 1), end_date=date(year + 1, 2, 28), league_id=1)
        for i, year in enumerate(range(2022, 2027))
    ])
    stat_specs = [
        ("Points scored", "PTS", "sum"), ("Total offensive yards", "YDS", "sum"),
        ("Turnovers", "TO", "sum"), ("Passing yards", "PASS_YDS", "sum"),
        ("Rushing yards", "RUSH_YDS", "sum"), ("Tackles", "TKL", "sum"),
    ]
    session.add_all([
        StatDefinition(stat_definition_id=i + 1, stat_name=name, abbreviation=abbr, calc_type=calc, sport_id=1)
        for i, (name, abbr, calc) in enumerate(stat_specs)
    ])
    session.flush()

    for season_id, year in enumerate(range(2022, 2027), 1):
        for team_id in range(1, 21):
            session.add(Roster(roster_id=(season_id - 1) * 20 + team_id, team_id=team_id, season_id=season_id))
    session.flush()
    positions = ["QB", "RB", "WR", "LB", "DB"]
    for season_id, year in enumerate(range(2022, 2027), 1):
        for athlete_id in range(1, 101):
            team_id = (athlete_id - 1) // 5 + 1
            slot = (athlete_id - 1) % 5
            session.add(Membership(
                membership_id=(season_id - 1) * 100 + athlete_id,
                roster_id=(season_id - 1) * 20 + team_id, athlete_id=athlete_id,
                position=positions[slot], jersey_number=["12", "24", "81", "54", "31"][slot],
                start_date=date(year, 8, 1), end_date=date(year + 1, 2, 28),
            ))
    session.flush()

    # Two rounds per season; the second 2026 round is scheduled for October 18.
    # This is a small demonstration schedule, not a complete professional season.
    for season_id, year in enumerate(range(2022, 2027), 1):
        for round_number in range(2):
            for pairing in range(10):
                game_id = (season_id - 1) * 20 + round_number * 10 + pairing + 1
                home_id = pairing + 1 if round_number == 0 else pairing + 11
                away_id = pairing + 11 if round_number == 0 else (pairing + 1) % 10 + 1
                scheduled = year == 2026 and round_number == 1
                game_time = datetime(year, 9, 13, 17, 0) if round_number == 0 else datetime(year, 10, 18, 17, 0)
                session.add(Game(game_id=game_id, game_time=game_time, status="scheduled" if scheduled else "completed", season_id=season_id, venue_id=(home_id - 1) // 2 + 1))
                session.flush()
                home_score, away_score = (None, None) if scheduled else (rng.choice([10, 14, 17, 20, 21, 24, 27, 28, 31, 35]), rng.choice([10, 14, 17, 20, 21, 24, 27, 28, 31, 35]))
                session.add_all([
                    GameParticipant(game_id=game_id, team_id=home_id, participant_role="home", score=home_score),
                    GameParticipant(game_id=game_id, team_id=away_id, participant_role="away", score=away_score),
                ])
                if scheduled:
                    continue
                for team_id, score in [(home_id, home_score), (away_id, away_score)]:
                    passing_yards, rushing_yards = rng.randint(130, 330), rng.randint(60, 190)
                    team_values = {1: score, 2: passing_yards + rushing_yards, 3: rng.randint(0, 4)}
                    for definition_id, value in team_values.items():
                        session.add(PerformanceStatistic(game_id=game_id, stat_definition_id=definition_id, athlete_id=None, team_id=team_id, stat_value=value))
                    athlete_values = [
                        ((team_id - 1) * 5 + 1, 4, passing_yards),
                        ((team_id - 1) * 5 + 2, 5, rushing_yards),
                        ((team_id - 1) * 5 + 4, 6, rng.randint(3, 12)),
                        ((team_id - 1) * 5 + 5, 6, rng.randint(2, 9)),
                    ]
                    for athlete_id, definition_id, value in athlete_values:
                        session.add(PerformanceStatistic(game_id=game_id, stat_definition_id=definition_id, athlete_id=athlete_id, team_id=None, stat_value=value))
    session.flush()

    # Use the same calculation as the application when game results change.
    from app.services import recalculate_standings

    recalculate_standings(session, range(1, 6))

    for user_id in range(1, 6):
        session.add_all([
            Favorite(user_id=user_id, sport_id=1, created_at=FIXTURE_TIMESTAMP),
            Favorite(user_id=user_id, league_id=1, created_at=FIXTURE_TIMESTAMP),
            Favorite(user_id=user_id, team_id=user_id, created_at=FIXTURE_TIMESTAMP),
            Favorite(user_id=user_id, athlete_id=(user_id - 1) * 5 + 1, created_at=FIXTURE_TIMESTAMP),
        ])
        for pair in range(2):
            team_a = user_id + pair * 5
            team_b = team_a + 10
            session.add(SavedComparison(user_id=user_id, sport_id=1, object_type="team", team_a_id=team_a, team_b_id=team_b, title=f"{cities[team_a - 1]} and {cities[team_b - 1]}", created_at=FIXTURE_TIMESTAMP))
            session.add(SavedComparison(user_id=user_id, sport_id=1, object_type="athlete", athlete_a_id=(team_a - 1) * 5 + 1, athlete_b_id=(team_b - 1) * 5 + 1, title=f"Quarterbacks: {cities[team_a - 1]} and {cities[team_b - 1]}", created_at=FIXTURE_TIMESTAMP))
    session.add_all([
        DataImport(import_id=i + 1, source_name=f"Synthetic fixtures (seed {SEED}), {year} season", imported_at=FIXTURE_TIMESTAMP, status="completed", run_by_user_id=3)
        for i, year in enumerate(range(2022, 2027))
    ])
    session.flush()


def print_counts(counts: dict[str, int]) -> None:
    for table_name, count in counts.items():
        print(f"{table_name}: {count}")


def main() -> None:
    try:
        with SessionLocal.begin() as session:
            seed_data(session)
            counts = row_counts(session)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc
    print(f"Loaded fictional data with random seed {SEED}.")
    print_counts(counts)


if __name__ == "__main__":
    main()
