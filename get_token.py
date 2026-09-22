import asyncio
from app.database import async_sessionmaker, engine
from app.models import User
from sqlalchemy import select
from app.auth import create_access_token

async def get_token():
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as db:
        user = (await db.execute(select(User).limit(1))).scalar_one_or_none()
        if user:
            token = create_access_token({"sub": str(user.id)})
            print(f"TOKEN={token}")
            print(f"USER={{\"id\":\"{user.id}\",\"name\":\"{user.name}\",\"email\":\"{user.email}\"}}")
        else:
            print("No users found.")

asyncio.run(get_token())
