from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

from app.config import settings

db_url = settings.DATABASE_URL
if not db_url:
    db_url = "sqlite:///./payzor.db"

if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
    print("Database connection initialized (SQLite).")
else:
    engine = create_engine(
        db_url,
        poolclass=NullPool,
        connect_args={
            "connect_timeout": 30,
        }
    )
    print("Database connection initialized (PostgreSQL).")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()