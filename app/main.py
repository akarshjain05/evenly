from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
import asyncio

from app.database import Base, engine, get_db
from app.routers import auth, users, groups, notifications, sync
from app.exceptions import InvalidSplitError
from app import rate_limiter, blocklist

async def _cleanup_rate_limiter():
    # ARCHITECTURE NOTE:
    # This background cleanup loop only functions meaningfully in persistent deployments 
    # (e.g., running via `uvicorn --reload` locally or on a standard VM).
    # In the Vercel serverless deployment path, each invocation is a fresh, short-lived process 
    # that terminates almost immediately after the response is sent. 
    # Therefore, this 300-second sleep cycle will never complete in production on Vercel.
    # Do not rely on this for actual memory cleanup in serverless environments.
    """Periodically prune the in-memory rate-limit store.
    Only needed when Redis is NOT configured (Redis uses key TTLs instead)."""
    while True:
        await asyncio.sleep(300)
        try:
            rate_limiter.cleanup_memory()
            blocklist.cleanup_memory()
        except Exception:
            logger.error("Rate limiter cleanup failed", exc_info=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.database import engine, get_db
    from app.migrations.add_sync_columns import run_migration
    async for db in get_db():
        await run_migration(db)
        await db.commit()
        break

    task = None
    if not rate_limiter._use_redis:
        task = asyncio.create_task(_cleanup_rate_limiter())
    yield
    if task is not None:
        task.cancel()

app = FastAPI(title="Evenly API", lifespan=lifespan)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

@app.exception_handler(InvalidSplitError)
async def invalid_split_handler(request: Request, exc: InvalidSplitError):
    return JSONResponse(status_code=400, content={"detail": exc.message})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error processing %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

from app.config import get_settings as _get_settings
cors_origins_str = _get_settings().cors_origins
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Accept", "Authorization"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(sync.router)
app.include_router(notifications.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.2"}
