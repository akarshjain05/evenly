import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print("No DATABASE_URL")
    exit(1)

# Fix asyncpg
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://")
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

async def main():
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT description, amount, updated_at FROM expenses ORDER BY updated_at DESC LIMIT 5"))
        print("Expenses in DB:")
        for r in res.fetchall():
            print(f"- {r[0]} | {r[1]} | {r[2]}")
            
        print("\nSync meta for users:")
        # Wait, sync meta is stored locally in IndexedDB! We can't see it on the server.
        
        # Check members
        res = await conn.execute(text("SELECT id, name, balance FROM members"))
        print("\nMembers in DB:")
        for r in res.fetchall():
            print(f"- {r[0][:8]}... | {r[1]} | {r[2]}")
            
    await engine.dispose()

asyncio.run(main())
