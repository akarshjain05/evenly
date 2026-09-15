import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# In production (Render), set DATABASE_URL to your Neon/Supabase Postgres
# connection string. Locally, leave it unset and it'll use a SQLite file
# next to this app so you can develop without any external database.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./evenly.db")

# Some providers (Render, Heroku-style) hand out "postgres://" URLs, but
# SQLAlchemy's psycopg2 driver wants "postgresql://". Normalize it.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
