"""
Database connection setup.

Creates the SQLAlchemy engine + session factory used across the app, and
exposes `get_db()` — a FastAPI dependency that hands each request its own
DB session and guarantees it's closed afterwards, even if an error occurs.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# `check_same_thread` is only needed for SQLite, which by default forbids
# using a connection across threads; FastAPI can call a route from a
# different thread than the one that opened the session.
connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args)

# Each instance of SessionLocal() is one DB conversation/transaction.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All ORM models (in models.py) inherit from this so SQLAlchemy knows
# about their tables and can create them with Base.metadata.create_all().
Base = declarative_base()


def get_db():
    """
    FastAPI dependency: yields a DB session for the duration of a single
    request, then always closes it (the `finally` runs even if the route
    raised an exception) so connections never leak.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
