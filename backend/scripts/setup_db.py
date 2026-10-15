"""Initialize and seed an empty SQLite prototype without resetting existing data."""

from __future__ import annotations

import re

from sqlalchemy import CheckConstraint, UniqueConstraint, inspect, text
from sqlalchemy.engine import Connection, make_url
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session


class SetupError(Exception):
    """An expected setup refusal with a message safe to show in the terminal."""


def normalized_sql(value: str | None) -> str | None:
    if value is None:
        return None
    return re.sub(r"\s+", " ", value).strip()


def inspect_schema(connection: Connection, metadata) -> bool:
    """Return True only for a database with no application objects.

    A populated but incompatible schema is still refused: automatic setup is
    neither a migration nor a way to guess which database the user intended.
    """
    objects = connection.execute(
        text("SELECT type, name FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*'")
    ).all()
    if not objects:
        return True
    if any(kind in {"view", "trigger"} for kind, _ in objects):
        raise SetupError(
            "Setup stopped: the database contains views or triggers. "
            "No data or schema was changed. Use manual setup for this database."
        )

    inspector = inspect(connection)
    actual_tables = {name for kind, name in objects if kind == "table"}
    expected_tables = set(metadata.tables)
    if actual_tables != expected_tables:
        raise SetupError(
            "Setup stopped: the database has a partial or different schema. "
            "No data or schema was changed. Choose a new empty SQLite file in "
            "DATABASE_URL, or handle this database manually."
        )

    compiler = connection.dialect.ddl_compiler(connection.dialect, None)
    for table in metadata.sorted_tables:
        columns = {
            column["name"]: column for column in inspector.get_columns(table.name)
        }
        if set(columns) != set(table.columns.keys()):
            incompatible_schema(table.name)
        for expected in table.columns:
            actual = columns[expected.name]
            if (
                str(actual["type"].compile(dialect=connection.dialect)).upper()
                != str(expected.type.compile(dialect=connection.dialect)).upper()
                or actual["nullable"] != expected.nullable
                or normalized_sql(actual["default"])
                != normalized_sql(compiler.get_column_default_string(expected))
            ):
                incompatible_schema(table.name)

        if tuple(
            inspector.get_pk_constraint(table.name)["constrained_columns"]
        ) != tuple(column.name for column in table.primary_key.columns):
            incompatible_schema(table.name)

        actual_foreign_keys = {
            (
                tuple(key["constrained_columns"]),
                key.get("referred_schema"),
                key["referred_table"],
                tuple(key["referred_columns"]),
                key.get("options", {}).get("ondelete", "NO ACTION").upper(),
                key.get("options", {}).get("onupdate", "NO ACTION").upper(),
            )
            for key in inspector.get_foreign_keys(table.name)
        }
        expected_foreign_keys = {
            (
                tuple(element.parent.name for element in key.elements),
                key.referred_table.schema,
                key.referred_table.name,
                tuple(element.column.name for element in key.elements),
                (key.ondelete or "NO ACTION").upper(),
                (key.onupdate or "NO ACTION").upper(),
            )
            for key in table.foreign_key_constraints
        }
        actual_unique = {
            tuple(constraint["column_names"])
            for constraint in inspector.get_unique_constraints(table.name)
        }
        expected_unique = {
            tuple(column.name for column in constraint.columns)
            for constraint in table.constraints
            if isinstance(constraint, UniqueConstraint)
        }
        actual_checks = {
            normalized_sql(constraint["sqltext"])
            for constraint in inspector.get_check_constraints(table.name)
        }
        expected_checks = {
            normalized_sql(str(constraint.sqltext))
            for constraint in table.constraints
            if isinstance(constraint, CheckConstraint)
        }
        if (
            actual_foreign_keys != expected_foreign_keys
            or actual_unique != expected_unique
            or actual_checks != expected_checks
        ):
            incompatible_schema(table.name)
    return False


def incompatible_schema(table_name: str) -> None:
    # This name comes from our own metadata, never from an arbitrary SQL error.
    raise SetupError(
        f"Setup stopped: table '{table_name}' does not match the current prototype "
        "columns or constraints. No data or schema was changed. Automatic setup "
        "does not migrate databases; use a new empty SQLite file or handle the "
        "existing schema manually."
    )


def setup_database() -> None:
    # Validate the configured URL before importing the shared engine. This keeps
    # unsupported database drivers or credentials out of setup error messages.
    from app.config import settings

    url = make_url(settings.database_url)
    if (
        url.drivername not in {"sqlite", "sqlite+pysqlite"}
        or url.database in {None, "", ":memory:"}
        or url.database.startswith("file:")
        or url.query
    ):
        raise SetupError(
            "Automatic setup supports only a plain SQLite database file, such as "
            "sqlite:///data/prototype.db. In-memory databases, SQLite URI options, "
            "and other database systems require manual setup."
        )

    from app.database import engine
    from app.models import Base
    from scripts.seed import SEED, print_counts, row_counts, seed_data

    try:
        with engine.connect() as connection:
            # Hold the write reservation before inspecting. A simultaneous setup
            # must wait, then observe the committed rows instead of seeding twice.
            # Explicit BEGIN also makes SQLite DDL part of this transaction.
            connection.exec_driver_sql("BEGIN IMMEDIATE")
            try:
                empty_database = inspect_schema(connection, Base.metadata)
                if empty_database:
                    Base.metadata.create_all(connection)

                with Session(bind=connection, autoflush=False) as session:
                    counts = row_counts(session)
                    populated = any(counts.values())
                    if not populated:
                        seed_data(session)
                        counts = row_counts(session)
                    # Commit the session's unit of work without committing the
                    # externally owned connection transaction.
                    session.commit()

                if populated:
                    connection.rollback()
                else:
                    connection.commit()
            except Exception:
                connection.rollback()
                raise
    finally:
        engine.dispose()

    if populated:
        print(
            "Database already contains records. Preserved all data; setup skipped creation and seeding."
        )
    else:
        if empty_database:
            print(f"Created {len(Base.metadata.tables)} tables using SQLAlchemy ORM.")
        else:
            print("Found a compatible schema with empty tables.")
        print(f"Loaded fictional data with random seed {SEED}.")
    print_counts(counts)


def main() -> None:
    try:
        setup_database()
    except SetupError as exc:
        raise SystemExit(str(exc)) from None
    except OperationalError:
        raise SystemExit(
            "Database setup could not open or lock the SQLite file. Check its path "
            "and permissions, and stop another writer before retrying. No reset was performed."
        ) from None
    except SQLAlchemyError:
        raise SystemExit(
            "Database setup could not complete safely. Any setup transaction was "
            "rolled back. Check that DATABASE_URL points to the intended SQLite "
            "prototype file; no reset was performed."
        ) from None
    except (OSError, ValueError, ImportError):
        raise SystemExit(
            "Database setup could not load its configuration or dependencies. "
            "Check backend/.env, file permissions, and run uv sync --frozen. "
            "No reset was performed."
        ) from None
    except Exception:
        raise SystemExit(
            "Database setup stopped unexpectedly. Any setup transaction was rolled "
            "back; no reset was performed. Check the local configuration and "
            "dependencies before retrying."
        ) from None


if __name__ == "__main__":
    main()
