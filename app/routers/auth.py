from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app import models, schemas, deps, auth, balances
from app.database import get_db
from app.rate_limiter import rate_limit_auth

router = APIRouter(prefix='/api/auth', tags=['auth'])

@router.post("/register")
async def register(payload: schemas.UserCreate, response: Response, db: AsyncSession = Depends(get_db), _=Depends(rate_limit_auth)):
    result = await db.execute(select(models.User).filter(models.User.email == payload.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(payload.password)
    user = models.User(email=payload.email, password_hash=hashed_password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = auth.create_access_token(data={"sub": user.id})
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax")
    return {"user": {"email": user.email}}

@router.post("/login")
async def login(payload: schemas.UserLogin, response: Response, db: AsyncSession = Depends(get_db), _=Depends(rate_limit_auth)):
    result = await db.execute(select(models.User).filter(models.User.email == payload.email))
    user = result.scalars().first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.id})
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax")
    return {"user": {"email": user.email}}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "ok"}

