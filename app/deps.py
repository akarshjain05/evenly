from fastapi import Depends, HTTPException, status, Request
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, database, auth

async def get_current_user(request: Request, db: AsyncSession = Depends(database.get_db)):
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
    request: Request,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db),
) -> models.Member:
    group_id = request.path_params.get("group_id") or request.path_params.get("id")
    if not group_id:
        raise HTTPException(status_code=400, detail="Group ID missing from path parameters")
        
    result = await db.execute(select(models.Member).filter(models.Member.user_id == user.id, models.Member.group_id == group_id))
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this tab")
    return member
