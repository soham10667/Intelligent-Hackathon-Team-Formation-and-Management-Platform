import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool, QueuePool
from app.core.config import settings

logger = logging.getLogger("database")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "hackathon_platform.db")

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    is_sqlite = "sqlite" in db_url

    if is_sqlite:
        connect_args = {"check_same_thread": False, "timeout": 30.0}
        pool_kwargs = {"poolclass": NullPool}
    else:
        connect_args = {"connect_timeout": 2}
        pool_kwargs = {"poolclass": QueuePool, "pool_size": 50, "max_overflow": 50, "pool_pre_ping": True}

    try:
        engine = create_engine(
            db_url,
            echo=False,
            future=True,
            connect_args=connect_args,
            **pool_kwargs
        )
        # Test connection
        with engine.connect() as conn:
            pass
        return engine
    except Exception as e:
        logger.warning(f"Could not connect to configured DB ({db_url}): {e}. Falling back to high-concurrency local SQLite engine.")
        fallback_url = f"sqlite:///{SQLITE_DB_PATH}"
        engine = create_engine(
            fallback_url,
            echo=False,
            future=True,
            poolclass=NullPool,
            connect_args={"check_same_thread": False, "timeout": 30.0}
        )
        return engine

engine = get_engine()

# Enable SQLite foreign key constraints and WAL mode for high concurrency
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(engine.url):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
