"""Relational schema shared by the ORM and the standalone SQLite DDL export."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, Float, ForeignKey, Integer, MetaData, String, UniqueConstraint, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def nonblank(*columns: str) -> CheckConstraint:
    """Keep required labels meaningful even for writes made outside the API."""
    return CheckConstraint(" AND ".join(f"length(trim({column})) > 0" for column in columns), name="nonblank_fields")


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention={
        "ix": "ix_%(table_name)s_%(column_0_name)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    })


class User(Base):
    __tablename__ = "app_user"
    __table_args__ = (
        CheckConstraint("role IN ('fan', 'analyst', 'admin')", name="valid_role"),
        nonblank("email", "display_name"),
    )
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    display_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), server_default="fan")


class Sport(Base):
    __tablename__ = "sport"
    __table_args__ = (nonblank("sport_name"),)
    sport_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sport_name: Mapped[str] = mapped_column(String(100), unique=True)


class League(Base):
    __tablename__ = "league"
    __table_args__ = (UniqueConstraint("sport_id", "league_name"), nonblank("league_name", "country"))
    league_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    league_name: Mapped[str] = mapped_column(String(150))
    country: Mapped[str] = mapped_column(String(100))
    sport_id: Mapped[int] = mapped_column(ForeignKey("sport.sport_id", ondelete="RESTRICT"), index=True)


class Team(Base):
    __tablename__ = "team"
    __table_args__ = (UniqueConstraint("league_id", "team_name"), nonblank("team_name", "city"))
    team_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_name: Mapped[str] = mapped_column(String(150))
    city: Mapped[str] = mapped_column(String(100))
    league_id: Mapped[int] = mapped_column(ForeignKey("league.league_id", ondelete="RESTRICT"), index=True)


class Athlete(Base):
    __tablename__ = "athlete"
    __table_args__ = (nonblank("first_name", "last_name"),)
    athlete_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100), index=True)
    nationality: Mapped[str | None] = mapped_column(String(100))


class Season(Base):
    __tablename__ = "season"
    __table_args__ = (
        UniqueConstraint("league_id", "season_name"),
        CheckConstraint("end_date >= start_date", name="date_order"),
        nonblank("season_name"),
    )
    season_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    season_name: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    league_id: Mapped[int] = mapped_column(ForeignKey("league.league_id", ondelete="RESTRICT"), index=True)


class Venue(Base):
    __tablename__ = "venue"
    __table_args__ = (nonblank("venue_name", "city"),)
    venue_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    venue_name: Mapped[str] = mapped_column(String(150))
    city: Mapped[str] = mapped_column(String(100))


class Roster(Base):
    __tablename__ = "roster"
    __table_args__ = (UniqueConstraint("team_id", "season_id"),)
    roster_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("team.team_id", ondelete="RESTRICT"), index=True)
    season_id: Mapped[int] = mapped_column(ForeignKey("season.season_id", ondelete="RESTRICT"), index=True)


class Membership(Base):
    __tablename__ = "membership"
    __table_args__ = (
        UniqueConstraint("roster_id", "athlete_id", "start_date"),
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="date_order"),
        nonblank("position"),
    )
    membership_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    roster_id: Mapped[int] = mapped_column(ForeignKey("roster.roster_id", ondelete="CASCADE"), index=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athlete.athlete_id", ondelete="RESTRICT"), index=True)
    position: Mapped[str] = mapped_column(String(40))
    jersey_number: Mapped[str | None] = mapped_column(String(10))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)


class Game(Base):
    __tablename__ = "game"
    __table_args__ = (CheckConstraint("status IN ('scheduled', 'in_progress', 'completed', 'cancelled')", name="valid_status"),)
    game_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(20), server_default="scheduled")
    season_id: Mapped[int] = mapped_column(ForeignKey("season.season_id", ondelete="RESTRICT"), index=True)
    venue_id: Mapped[int | None] = mapped_column(ForeignKey("venue.venue_id", ondelete="SET NULL"), index=True)


class GameParticipant(Base):
    __tablename__ = "game_participant"
    __table_args__ = (
        UniqueConstraint("game_id", "participant_role"),
        CheckConstraint("participant_role IN ('home', 'away')", name="valid_role"),
        CheckConstraint("score IS NULL OR score >= 0", name="nonnegative_score"),
    )
    game_id: Mapped[int] = mapped_column(ForeignKey("game.game_id", ondelete="CASCADE"), primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("team.team_id", ondelete="RESTRICT"), primary_key=True, index=True)
    participant_role: Mapped[str] = mapped_column(String(10))
    score: Mapped[int | None] = mapped_column(Integer)


class StatDefinition(Base):
    __tablename__ = "stat_definition"
    __table_args__ = (
        UniqueConstraint("sport_id", "abbreviation"),
        CheckConstraint("calc_type IN ('sum', 'average', 'min', 'max', 'last')", name="valid_calc_type"),
        nonblank("stat_name", "abbreviation"),
    )
    stat_definition_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    stat_name: Mapped[str] = mapped_column(String(100))
    abbreviation: Mapped[str] = mapped_column(String(20))
    calc_type: Mapped[str] = mapped_column(String(20))
    sport_id: Mapped[int] = mapped_column(ForeignKey("sport.sport_id", ondelete="RESTRICT"), index=True)


class PerformanceStatistic(Base):
    __tablename__ = "performance_statistic"
    __table_args__ = (
        CheckConstraint("(athlete_id IS NOT NULL AND team_id IS NULL) OR (athlete_id IS NULL AND team_id IS NOT NULL)", name="one_subject"),
        UniqueConstraint("game_id", "stat_definition_id", "athlete_id", name="uq_performance_statistic_athlete"),
        UniqueConstraint("game_id", "stat_definition_id", "team_id", name="uq_performance_statistic_team"),
    )
    performance_statistic_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("game.game_id", ondelete="CASCADE"), index=True)
    stat_definition_id: Mapped[int] = mapped_column(ForeignKey("stat_definition.stat_definition_id", ondelete="RESTRICT"), index=True)
    athlete_id: Mapped[int | None] = mapped_column(ForeignKey("athlete.athlete_id", ondelete="RESTRICT"), index=True)
    team_id: Mapped[int | None] = mapped_column(ForeignKey("team.team_id", ondelete="RESTRICT"), index=True)
    stat_value: Mapped[float] = mapped_column(Float)


class Standing(Base):
    __tablename__ = "standing"
    __table_args__ = (
        UniqueConstraint("team_id", "season_id"),
        CheckConstraint("rank > 0", name="positive_rank"),
        CheckConstraint("wins >= 0 AND losses >= 0 AND ties >= 0", name="nonnegative_record"),
        CheckConstraint("points >= 0", name="nonnegative_points"),
    )
    standing_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("team.team_id", ondelete="CASCADE"), index=True)
    season_id: Mapped[int] = mapped_column(ForeignKey("season.season_id", ondelete="CASCADE"), index=True)
    rank: Mapped[int] = mapped_column(Integer)
    wins: Mapped[int] = mapped_column(Integer, server_default="0")
    losses: Mapped[int] = mapped_column(Integer, server_default="0")
    ties: Mapped[int] = mapped_column(Integer, server_default="0")
    points: Mapped[float] = mapped_column(Float, server_default="0")


class Favorite(Base):
    __tablename__ = "favorite"
    __table_args__ = (
        CheckConstraint("CASE WHEN sport_id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN league_id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN team_id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN athlete_id IS NOT NULL THEN 1 ELSE 0 END = 1", name="one_target"),
        UniqueConstraint("user_id", "sport_id", name="uq_favorite_sport"),
        UniqueConstraint("user_id", "league_id", name="uq_favorite_league"),
        UniqueConstraint("user_id", "team_id", name="uq_favorite_team"),
        UniqueConstraint("user_id", "athlete_id", name="uq_favorite_athlete"),
    )
    favorite_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("app_user.user_id", ondelete="CASCADE"), index=True)
    sport_id: Mapped[int | None] = mapped_column(ForeignKey("sport.sport_id", ondelete="CASCADE"), index=True)
    league_id: Mapped[int | None] = mapped_column(ForeignKey("league.league_id", ondelete="CASCADE"), index=True)
    team_id: Mapped[int | None] = mapped_column(ForeignKey("team.team_id", ondelete="CASCADE"), index=True)
    athlete_id: Mapped[int | None] = mapped_column(ForeignKey("athlete.athlete_id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


class SavedComparison(Base):
    __tablename__ = "saved_comparison"
    __table_args__ = (CheckConstraint(
        "(object_type = 'athlete' AND athlete_a_id IS NOT NULL AND athlete_b_id IS NOT NULL AND athlete_a_id <> athlete_b_id AND team_a_id IS NULL AND team_b_id IS NULL) OR (object_type = 'team' AND team_a_id IS NOT NULL AND team_b_id IS NOT NULL AND team_a_id <> team_b_id AND athlete_a_id IS NULL AND athlete_b_id IS NULL)",
        name="valid_pair",
    ), nonblank("title"))
    comparison_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("app_user.user_id", ondelete="CASCADE"), index=True)
    sport_id: Mapped[int] = mapped_column(ForeignKey("sport.sport_id", ondelete="CASCADE"), index=True)
    object_type: Mapped[str] = mapped_column(String(20))
    athlete_a_id: Mapped[int | None] = mapped_column(ForeignKey("athlete.athlete_id", ondelete="CASCADE"), index=True)
    athlete_b_id: Mapped[int | None] = mapped_column(ForeignKey("athlete.athlete_id", ondelete="CASCADE"), index=True)
    team_a_id: Mapped[int | None] = mapped_column(ForeignKey("team.team_id", ondelete="CASCADE"), index=True)
    team_b_id: Mapped[int | None] = mapped_column(ForeignKey("team.team_id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))


class DataImport(Base):
    __tablename__ = "data_import"
    __table_args__ = (
        CheckConstraint("status IN ('completed', 'failed', 'pending')", name="valid_status"),
        nonblank("source_name"),
    )
    import_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_name: Mapped[str] = mapped_column(String(200))
    imported_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    status: Mapped[str] = mapped_column(String(20), server_default="pending")
    run_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("app_user.user_id", ondelete="SET NULL"), index=True)
