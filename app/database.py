from dotenv import load_dotenv

load_dotenv()
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

import logging
from app.config import get_settings

logger = logging.getLogger(__name__)
db_url = get_settings().database_url
DATABASE_URL = db_url

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# For SQLite (local dev)
if DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
    )
else:
    # Supabase PgBouncer in transaction mode doesn't support asyncpg prepared statements.
    # statement_cache_size=0 disables them. SSL is handled by the connection URL itself.
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"statement_cache_size": 0},
        pool_size=5,
        max_overflow=10,
    )

AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as db:
        yield db
