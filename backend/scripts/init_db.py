"""Create tables by SQL or ORM, optionally populating fictional demo data."""

from __future__ import annotations

import argparse
from pathlib import Path

from sqlalchemy import inspect

from app.database import SessionLocal, engine
from app.models import Base
from scripts.export_schema import SCHEMA_PATH
from scripts.seed import print_counts, row_counts, seed_data


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--method", choices=("sql", "orm"), default="orm")
    parser.add_argument("--reset", action="store_true", help="Delete only the configured SQLite database file before rebuilding.")
    parser.add_argument("--seed", action="store_true", help="Also populate fictional demo data after creating tables.")
    args = parser.parse_args()

    if args.reset:
        if engine.dialect.name != "sqlite" or engine.url.database in (None, "", ":memory:"):
            parser.error("--reset is supported only for a configured SQLite database file.")
        database_path = Path(engine.url.database)
        if database_path.is_symlink():
            parser.error("Refusing to reset a SQLite path that is a symbolic link.")
        engine.dispose()
        database_path.unlink(missing_ok=True)

    if inspect(engine).get_table_names() or inspect(engine).get_view_names():
        parser.error("Database is not empty. Use a new DATABASE_URL or explicitly pass --reset for SQLite.")
    if args.method == "orm":
        Base.metadata.create_all(engine)
    else:
        if engine.dialect.name != "sqlite":
            parser.error("schema.sql targets SQLite. Use --method orm for other configured databases.")
        connection = engine.raw_connection()
        try:
            connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    print(f"Created {len(Base.metadata.tables)} tables using {args.method}.")
    with SessionLocal.begin() as session:
        if args.seed:
            seed_data(session)
        counts = row_counts(session)
    print_counts(counts)


if __name__ == "__main__":
    main()
