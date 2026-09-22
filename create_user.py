import asyncio
from app.database import async_sessionmaker, engine
from app.models import User
from app.auth import get_password_hash
from sqlalchemy.ext.asyncio import AsyncSession

async def create():
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as db:
        user = User(email="test@test.com", name="Test User", password_hash=get_password_hash("password123"))
        db.add(user)
        await db.commit()

asyncio.run(create())
