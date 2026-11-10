"""Add only authentication tables to a compatible existing SQLite database."""

from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError

from app.auth.schema import AUTH_TABLES
from app.database import engine
from app.models import Base
from scripts.setup_db import SetupError, inspect_schema


def main() -> None:
    if engine.dialect.name != "sqlite":
        raise SystemExit("This upgrade supports the SQLite prototype only.")
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("BEGIN IMMEDIATE")
            try:
                if inspect_schema(connection, Base.metadata, AUTH_TABLES):
                    raise SetupError("Database is empty. Run npm run setup to initialize it first.")
                existing = set(inspect(connection).get_table_names())
                if AUTH_TABLES.issubset(existing):
                    print("Authentication tables are already present. No changes needed.")
                else:
                    Base.metadata.create_all(
                        connection, tables=[Base.metadata.tables[name] for name in AUTH_TABLES]
                    )
                    print("Added authentication tables. All existing records were preserved.")
                connection.commit()
            except Exception:
                connection.rollback()
                raise
    except SetupError as exc:
        raise SystemExit(str(exc)) from None
    except SQLAlchemyError:
        raise SystemExit(
            "Upgrade could not complete. No changes were saved. Check DATABASE_URL and stop other writers."
        ) from None
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
