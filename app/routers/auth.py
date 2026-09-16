from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas, deps, auth, balances
from app.database import get_db
from app.rate_limiter import rate_limit_auth

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post("/register")
def register(payload: schemas.UserCreate, db: Session = Depends(get_db), _=Depends(rate_limit_auth)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(payload.password)
    user = models.User(email=payload.email, password_hash=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email}}

@router.post("/login")
def login(payload: schemas.UserLogin, db: Session = Depends(get_db), _=Depends(rate_limit_auth)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email}}

