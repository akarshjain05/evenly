from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from typing import List, Dict, Any
import os
import io
import csv
import json
import time

from app import models, schemas, deps, auth, balances
from app.database import get_db

router = APIRouter(prefix='/api/notifications', tags=['notifications'])

@router.post("/subscribe", response_model=schemas.BasicResponse)
async def subscribe_push(
    payload: schemas.PushSubscriptionCreate,
    user: models.User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.PushSubscription).filter(
        models.PushSubscription.user_id == user.id, 
        models.PushSubscription.endpoint == payload.endpoint
    ))
    sub = result.scalars().first()
    if not sub:
        sub = models.PushSubscription(user_id=user.id, endpoint=payload.endpoint, p256dh=payload.p256dh, auth=payload.auth)
        db.add(sub)
        await db.commit()
    return {"ok": True}

@router.get("/vapid-public")
def get_vapid_public():
    return {"public_key": os.environ.get("VAPID_PUBLIC_KEY")}

