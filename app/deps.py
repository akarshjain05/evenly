import os
from fastapi import Depends, HTTPException, status, Request
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, database, auth, blocklist

import secrets
from fastapi import Response

if os.environ.get("DISABLE_CSRF_PROTECTION") == "1" and not os.environ.get("TESTING"):
    raise RuntimeError("DISABLE_CSRF_PROTECTION must not be set in production")


async def verify_csrf(request: Request):
    if request.method in ["POST", "PUT", "DELETE", "PATCH"] and os.environ.get("DISABLE_CSRF_PROTECTION") != "1":
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("x-csrf-token")
        if not csrf_cookie or not csrf_header or not secrets.compare_digest(csrf_cookie, csrf_header):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token validation failed",
            )
            
        if os.environ.get("TESTING") != "1":
            origin = request.headers.get("origin") or request.headers.get("referer")
            if not origin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Missing Origin/Referer header",
                )
            from urllib.parse import urlparse
            parsed_origin = urlparse(origin).hostname
            
            allowed_origins = ["localhost", "127.0.0.1", "evenly-eight.vercel.app", request.url.hostname]
            if parsed_origin not in allowed_origins:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Invalid origin: {parsed_origin}",
                )




async def get_current_user(request: Request, db: AsyncSession = Depends(database.get_db), _csrf=Depends(verify_csrf)):
    
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
            
        jti = payload.get("jti")
        if jti and await blocklist.is_token_blocked(jti):
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
