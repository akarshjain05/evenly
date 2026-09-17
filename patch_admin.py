import asyncio
from app.database import AsyncSessionLocal
from app import models
from sqlalchemy import select

async def fix():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(models.Member).filter(models.Member.user_id == "ae1018d8d7204331930d2216da4b7657"))
        members = result.scalars().all()
        for m in members:
            if not m.is_admin:
                print(f"Fixing admin status for {m.id}")
                m.is_admin = True
        await db.commit()
        print("Done")

asyncio.run(fix())
