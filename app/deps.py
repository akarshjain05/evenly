from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from . import models, database, auth

def get_current_user(token: str = Depends(auth.oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_member(
    group_id: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
) -> models.Member:
    member = (
        db.query(models.Member)
        .filter(models.Member.user_id == user.id, models.Member.group_id == group_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this tab")
    return member
