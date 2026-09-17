import os
from dotenv import load_dotenv

load_dotenv()
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./evenly.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Supabase uses PgBouncer in transaction pooling mode which is incompatible
# with asyncpg's prepared statements. Disable them and enable SSL.
if "asyncpg" in DATABASE_URL:
    connect_args["ssl"] = True
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(DATABASE_URL, connect_args=connect_args)
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as db:
        yield db
