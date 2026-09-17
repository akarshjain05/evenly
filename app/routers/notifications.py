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

from pywebpush import webpush, WebPushException
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

async def send_web_push(user_ids: list, title: str, body: str):
    from app.database import AsyncSessionLocal
    import asyncio
    async with AsyncSessionLocal() as db:
        vapid_priv = os.environ.get("VAPID_PRIVATE_KEY")
        if not vapid_priv: return
        
        result = await db.execute(select(models.PushSubscription).filter(models.PushSubscription.user_id.in_(user_ids)))
        subs = result.scalars().all()
        for sub in subs:
            try:
                await asyncio.to_thread(
                    webpush,
                    subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
                    data=json.dumps({"title": title, "body": body}),
                    vapid_private_key=vapid_priv,
                    vapid_claims={"sub": "mailto:admin@evenly.app"}
                )
            except WebPushException as e:
                if e.response and e.response.status_code in [404, 410]:
                    await db.delete(sub)
                    await db.commit()
