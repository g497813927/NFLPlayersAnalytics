"""Keep private account queries out of terminal and browser SQL traces."""

import logging

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from ..database import database_url, enable_sqlite_foreign_keys

auth_engine = create_engine(
    database_url,
    echo=False,
    hide_parameters=True,
    logging_name="private_auth",
    connect_args={"check_same_thread": False, "timeout": 10}
    if database_url.get_backend_name() == "sqlite"
    else {},
)
logging.getLogger("sqlalchemy.engine.Engine.private_auth").setLevel(logging.WARNING)
if database_url.get_backend_name() == "sqlite":
    event.listen(auth_engine, "connect", enable_sqlite_foreign_keys)

AuthSessionLocal = sessionmaker(bind=auth_engine, autoflush=False, expire_on_commit=False)
