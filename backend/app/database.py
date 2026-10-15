"""SQLAlchemy setup; database creation and sample loading are explicit commands."""

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from .config import BACKEND_DIR, settings

database_url = make_url(settings.database_url)
if database_url.get_backend_name() == "sqlite" and database_url.database not in (
    None,
    "",
    ":memory:",
):
    database_path = Path(database_url.database).expanduser()
    if not database_path.is_absolute():
        database_path = BACKEND_DIR / database_path
    database_path.parent.mkdir(parents=True, exist_ok=True)
    database_url = database_url.set(database=str(database_path.resolve()))

engine = create_engine(
    database_url,
    echo=settings.sql_echo,
    connect_args={"check_same_thread": False, "timeout": 10}
    if database_url.get_backend_name() == "sqlite"
    else {},
)


def enable_sqlite_foreign_keys(dbapi_connection, _connection_record=None) -> None:
    # PRAGMA must run outside a transaction, including on Python's newer driver.
    previous = getattr(dbapi_connection, "autocommit", None)
    if previous is not None:
        dbapi_connection.autocommit = True
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
    finally:
        cursor.close()
        if previous is not None:
            dbapi_connection.autocommit = previous


if database_url.get_backend_name() == "sqlite":
    event.listen(engine, "connect", enable_sqlite_foreign_keys)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    with SessionLocal() as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise
