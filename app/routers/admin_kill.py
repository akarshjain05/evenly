from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

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
