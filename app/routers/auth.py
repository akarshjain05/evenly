import os

import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app import models, schemas, deps, auth, balances
from app.database import get_db
from app.rate_limiter import rate_limit_auth

# 7 days in seconds, matching the JWT expiration
COOKIE_MAX_AGE_SEC = int(os.environ.get("COOKIE_MAX_AGE_SEC", "2592000"))  # Default 30 days


router = APIRouter(prefix='/api/auth', tags=['auth'])
logger = logging.getLogger(__name__)

@router.post("/register")
async def register(payload: schemas.UserCreate, response: Response, db: AsyncSession = Depends(get_db), _=Depends(rate_limit_auth)):
    result = await db.execute(select(models.User).filter(models.User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(payload.password)
    user = models.User(email=payload.email, name=payload.name, password_hash=hashed_password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = auth.create_access_token(data={"sub": user.id})
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax", max_age=COOKIE_MAX_AGE_SEC)
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(key="csrf_token", value=csrf_token, httponly=False, secure=True, samesite="lax", max_age=COOKIE_MAX_AGE_SEC)
    logger.info(f"User {user.id} ({user.email}) logged in successfully")
    return {"user": {"email": user.email}}

@router.post("/login")
async def login(payload: schemas.UserLogin, response: Response, db: AsyncSession = Depends(get_db), _=Depends(rate_limit_auth)):
    result = await db.execute(select(models.User).filter(models.User.email == payload.email))
    user = result.scalars().first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.id})
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax", max_age=COOKIE_MAX_AGE_SEC)
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(key="csrf_token", value=csrf_token, httponly=False, secure=True, samesite="lax", max_age=COOKIE_MAX_AGE_SEC)
    logger.info(f"User {user.id} ({user.email}) logged in successfully")
    return {"user": {"email": user.email}}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("csrf_token")
    return {"status": "ok"}

