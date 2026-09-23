import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import Group
from app.balances import recompute_balances_from_ledger

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("No DATABASE_URL")
        return
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        groups = (await db.execute(select(Group.id))).scalars().all()
        for g_id in groups:
            await recompute_balances_from_ledger(db, g_id)
        await db.commit()
    print("Done")

asyncio.run(main())
