from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
import asyncio

from app.database import Base, engine, get_db, SessionLocal
from app.routers import auth, users, groups, notifications
from app import rate_limiter

async def _cleanup_rate_limiter():
    """Periodically prune the in-memory rate-limit store.
    Only needed when Redis is NOT configured (Redis uses key TTLs instead)."""
    while True:
        await asyncio.sleep(300)
        try:
            rate_limiter.cleanup_memory()
        except Exception:
            logger.error("Rate limiter cleanup failed", exc_info=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = None
    if not rate_limiter._use_redis:
        task = asyncio.create_task(_cleanup_rate_limiter())
    yield
    if task is not None:
        task.cancel()

app = FastAPI(title="Evenly API", lifespan=lifespan)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error processing {request.method} {request.url}")
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000")
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

PALETTE = ["#B4863A", "#4F7D5A", "#A8483A", "#5C7A8A", "#8A5C7A", "#7A8A4F"]

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(notifications.router)

from sqlalchemy.orm import Session
from fastapi import Depends

@app.get("/api/migrate")
def migrate_db(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        # Add is_admin to members
        try:
            db.execute(text("ALTER TABLE members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;"))
        except Exception as e:
            logger.info(f"is_admin already exists or error: {e}")
            db.rollback()
            
        # Add balance to members
        try:
            db.execute(text("ALTER TABLE members ADD COLUMN balance NUMERIC DEFAULT 0 NOT NULL;"))
        except Exception as e:
            logger.info(f"balance already exists or error: {e}")
            db.rollback()
            
        # Alter Float to Numeric (this is actually usually fine if left as float in PG, but we can try)
        try:
            db.execute(text("ALTER TABLE expenses ALTER COLUMN amount TYPE NUMERIC;"))
            db.execute(text("ALTER TABLE expense_splits ALTER COLUMN share_amount TYPE NUMERIC;"))
            db.execute(text("ALTER TABLE settlements ALTER COLUMN amount TYPE NUMERIC;"))
        except Exception as e:
            logger.info(f"numeric cast error: {e}")
            db.rollback()

        db.commit()
        return {"status": "migrated"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}

@app.get("/api/health")
def health():
    return {"status": "ok"}


