from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text
from typing import List, Dict, Any
import os
import io
import csv
import json
import time

from app import models, schemas, deps, auth, balances
from app.database import get_db

router = APIRouter(prefix='/api/users', tags=['users'])

@router.get("/me")
def get_me(user: models.User = Depends(deps.get_current_user)):
    return {"id": user.id, "email": user.email}

@router.get("/me/groups", response_model=list[schemas.MembershipResponse])
def get_my_groups(user: models.User = Depends(deps.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).options(
        selectinload(models.User.memberships).selectinload(models.Member.group)
    ).filter(models.User.id == user.id).first()
    return [
        {
            "group": {"id": m.group.id, "name": m.group.name, "invite_code": m.group.invite_code},
            "member": {"id": m.id, "name": m.name, "color": m.color}
        }
        for m in user.memberships
    ]

