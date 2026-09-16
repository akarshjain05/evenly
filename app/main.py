from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import time
import os
import asyncio

from app.database import Base, engine, get_db, SessionLocal
from app.routers import auth, users, groups, notifications

app = FastAPI(title="Evenly API")

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

async def cleanup_rate_limiter():
    while True:
        await asyncio.sleep(300)
        now = time.time()
        for ip in list(auth.auth_attempts.keys()):
            valid_attempts = [t for t in auth.auth_attempts[ip] if now - t < 60]
            if valid_attempts:
                auth.auth_attempts[ip] = valid_attempts
            else:
                del auth.auth_attempts[ip]

@app.on_event("startup")
async def startup_rate_limiter_cleanup():
    asyncio.create_task(cleanup_rate_limiter())

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(notifications.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

@app.get("/group-{group_id}", include_in_schema=False)
@app.get("/settings", include_in_schema=False)
@app.get("/new", include_in_schema=False)
def serve_spa():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
