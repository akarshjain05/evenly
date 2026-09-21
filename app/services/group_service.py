from functools import lru_cache
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app import models, schemas, balances
from app.services.notification_service import send_web_push
import random
from typing import List, Dict, Any
from decimal import Decimal
import io
import csv

PALETTE = ["#B4863A", "#4F7D5A", "#A8483A", "#5C7A8A", "#8A5C7A", "#7A8A4F"]
def pick_color() -> str:
    return random.choice(PALETTE)

async def create_group_transaction(payload: schemas.GroupCreate, user: models.User, db: AsyncSession):
    group = models.Group(name=payload.name)
    db.add(group)
    await db.flush()
    member = models.Member(
        group_id=group.id,
        user_id=user.id,
        name=payload.your_name or user.name or "Unknown",
        is_admin=True,
        color=pick_color()
    )
    group_id = group.id
    db.add(member)
    await db.flush()
    
    group_summary = {"id": group_id, "name": payload.name, "invite_code": group.invite_code}
    member_resp = {"id": member.id, "name": member.name, "color": member.color, "is_admin": True, "user_id": user.id}
    
    await db.commit()
    return {"group": group_summary, "member": member_resp}

async def join_group_transaction(invite_code: str, payload: schemas.JoinRequest, user: models.User, db: AsyncSession):
    result = await db.execute(select(models.Group).filter(models.Group.invite_code == invite_code).with_for_update())
    group = result.scalars().first()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite link")

    res = await db.execute(select(models.Member).filter(models.Member.group_id == group.id, models.Member.user_id == user.id))
    existing = res.scalars().first()
    
    group_summary = {"id": group.id, "name": group.name, "invite_code": group.invite_code}
    
    if existing:
        member_resp = {"id": existing.id, "name": existing.name, "color": existing.color, "is_admin": existing.is_admin, "user_id": user.id}
        return {"group": group_summary, "member": member_resp}

    from sqlalchemy import func
    member_count_res = await db.execute(select(func.count()).select_from(models.Member).filter(models.Member.group_id == group.id))
    member_count = member_count_res.scalar() or 0
    if member_count >= 50:
        raise HTTPException(status_code=400, detail="Group is full (max 50 members)")

    member = models.Member(
        group_id=group.id,
        user_id=user.id,
        name=payload.name or user.name or "Unknown",
        color=pick_color()
    )
    group_id = group.id
    db.add(member)
    await db.flush()
    
    member_resp = {"id": member.id, "name": member.name, "color": member.color, "is_admin": False, "user_id": user.id}
    await db.commit()
    
    return {"group": group_summary, "member": member_resp}


@lru_cache(maxsize=1024)
def _cached_simplify_debts(balances_fs):
    return balances.simplify_debts({k: v for k, v in balances_fs})

async def get_group_details(group_id: str, db: AsyncSession):
    result = await db.execute(select(models.Group).options(selectinload(models.Group.members)).filter(models.Group.id == group_id))
    group = result.scalars().first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    active_members = [m for m in group.members if not m.is_deleted]
    net_balances = {m.id: m.balance for m in active_members}
    debts = _cached_simplify_debts(frozenset(net_balances.items()))
    member_map = {m.id: m for m in active_members}
    
    return {
        "id": group.id,
        "name": group.name,
        "invite_code": group.invite_code,
        "created_at": group.created_at,
        "members": [
            {
                "id": m.id, 
                "name": m.name, 
                "color": m.color,
                "is_admin": m.is_admin,
                "user_id": m.user_id,
                "balance": m.balance.quantize(Decimal('0.01'))
            } for m in active_members
        ],
        "simplified_debts": [
            {
                "from_member": d["from_member"],
                "to_member": d["to_member"],
                "amount": d["amount"],
                "from_name": member_map[d["from_member"]].name,
                "to_name": member_map[d["to_member"]].name
            } for d in debts
        ]
    }

async def remove_member_transaction(group_id: str, member_id: str, db: AsyncSession):
    await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())

    result = await db.execute(select(models.Member).filter(models.Member.id == member_id, models.Member.group_id == group_id))
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    await balances.recompute_balances_from_ledger(db, group_id)
    await db.refresh(member)
    
    if abs(member.balance) > Decimal("0.01"):
        raise HTTPException(status_code=400, detail="Cannot remove member with unsettled balance.")

    member.is_deleted = True
    from datetime import datetime, timezone
    member.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}
