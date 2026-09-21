from app.config import get_settings
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import uuid
from passlib.context import CryptContext
import asyncio

from . import models, database

SECRET_KEY = get_settings().jwt_secret_key
ALGORITHM = get_settings().jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = get_settings().access_token_expire_minutes

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    return await asyncio.to_thread(pwd_context.verify, plain_password, hashed_password)

async def get_password_hash(password: str) -> str:
    return await asyncio.to_thread(pwd_context.hash, password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "jti": str(uuid.uuid4())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


