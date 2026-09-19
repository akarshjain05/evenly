import os
import json
import asyncio
from sqlalchemy import select
from pywebpush import webpush, WebPushException

from app import models
from app.database import AsyncSessionLocal

async def send_web_push(user_ids: list, title: str, body: str):
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
