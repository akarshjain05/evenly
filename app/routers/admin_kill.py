from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/kill-idle")
async def kill_idle(db: AsyncSession = Depends(get_db)):
    # Kill idle in transaction connections
    query = text("""
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE state = 'idle in transaction'
        AND pid <> pg_backend_pid();
    """)
    await db.execute(query)
    await db.commit()
    return {"status": "killed"}

@router.get("/migrate")
async def migrate_db(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("ALTER TABLE expenses ADD COLUMN created_by_user_id VARCHAR REFERENCES users(id);"))
    except Exception as e:
        print(e)
    try:
        await db.execute(text("ALTER TABLE settlements ADD COLUMN created_by_user_id VARCHAR REFERENCES users(id);"))
    except Exception as e:
        print(e)
    await db.commit()
    return {"status": "migrated"}
