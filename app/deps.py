import os
from fastapi import Depends, HTTPException, status, Request
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, database, auth

import secrets
from fastapi import Response

if os.environ.get("DISABLE_CSRF_PROTECTION") == "1" and not os.environ.get("TESTING"):
    raise RuntimeError("DISABLE_CSRF_PROTECTION must not be set in production")


async def get_current_user(request: Request, response: Response, db: AsyncSession = Depends(database.get_db)):

    if request.method in ["POST", "PUT", "DELETE", "PATCH"] and os.environ.get("DISABLE_CSRF_PROTECTION") != "1":
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("x-csrf-token")
        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token validation failed",
            )

    if request.method == "GET" and not request.cookies.get("csrf_token") and os.environ.get("DISABLE_CSRF_PROTECTION") != "1":
        new_token = secrets.token_urlsafe(32)
        response.set_cookie(key="csrf_token", value=new_token, httponly=False, secure=True, samesite="lax", max_age=7*24*60*60)
    
    token = request.cookies.get("access_token")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    result = await db.execute(select(models.User).filter(models.User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_member(
    group_id: str,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db),
) -> models.Member:
    result = await db.execute(select(models.Member).filter(models.Member.user_id == user.id, models.Member.group_id == group_id))
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this tab")
    return member
