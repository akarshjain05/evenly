from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app import models, schemas, balances
from app.routers.notifications import send_web_push
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

    member_name = payload.your_name or user.name or user.email.split('@')[0]
    member_name = member_name.capitalize()

    member = models.Member(group_id=group.id, user_id=user.id, name=member_name, color=pick_color(), is_admin=True)
    db.add(member)
    await db.commit()
    await db.refresh(group)
    await db.refresh(member)
    return {"group": group, "member": member}

async def join_group_transaction(invite_code: str, payload: schemas.JoinRequest, user: models.User, db: AsyncSession):
    result = await db.execute(select(models.Group).filter(models.Group.invite_code == invite_code))
    group = result.scalars().first()
    if not group:
        raise HTTPException(status_code=404, detail="Tab not found")

    result = await db.execute(select(models.Member).filter(models.Member.group_id == group.id, models.Member.user_id == user.id))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="You are already in this tab")

    member_name = payload.name or user.name or user.email.split('@')[0]
    member_name = member_name.capitalize()

    member = models.Member(group_id=group.id, user_id=user.id, name=member_name, color=pick_color(), is_admin=False)
    db.add(member)
    await db.commit()
    await db.refresh(group)
    await db.refresh(member)
    return {"group": group, "member": member}

async def get_group_details(group_id: str, db: AsyncSession):
    result = await db.execute(select(models.Group).options(selectinload(models.Group.members)).filter(models.Group.id == group_id))
    group = result.scalars().first()
    if not group:
        raise HTTPException(status_code=404, detail="Tab not found")
    
    net = await balances.compute_net_balances(db, group_id)


    members_dict = {m.id: m.name for m in group.members}
    debts = balances.simplify_debts(net)
    for d in debts:
        d["from_name"] = members_dict.get(d["from_member"], "Unknown")
        d["to_name"] = members_dict.get(d["to_member"], "Unknown")

        
    return {
        "id": group.id,
        "name": group.name,
        "invite_code": group.invite_code,
        "created_at": group.created_at,
        "members": [
            {"id": m.id, "name": m.name, "color": m.color, "is_admin": m.is_admin, "balance": net.get(m.id, Decimal(0))}
            for m in group.members
        ],
        "simplified_debts": debts
    }


async def process_and_add_expense(payload: schemas.ExpenseCreate, group_id: str, user: models.User, member: models.Member, db: AsyncSession, background_tasks):
    expense = models.Expense(
        group_id=group_id,
        description=payload.description,
        amount=payload.amount,
        paid_by=payload.paid_by,
        category=payload.category,
        split_type=payload.split_type,
        created_by_user_id=user.id
    )
    db.add(expense)
    await db.flush()
    await balances.process_expense_splits(db, group_id, expense, payload)
    await db.flush()
    await balances.apply_expense(db, expense)
    await db.commit()

    result = await db.execute(select(models.Group).filter(models.Group.id == group_id))
    group = result.scalars().first()
    members_res = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    other_user_ids = [m.user_id for m in members_res.scalars().all() if m.user_id and m.id != member.id]
    if other_user_ids:
        background_tasks.add_task(send_web_push, other_user_ids, group.name, f"{member.name} added a new expense: {payload.description}")

async def process_and_add_settlement(payload: schemas.SettlementCreate, group_id: str, user: models.User, member: models.Member, db: AsyncSession, background_tasks):
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    valid_ids = {m.id for m in result.scalars().all()}
    if payload.from_member not in valid_ids or payload.to_member not in valid_ids:
        raise HTTPException(status_code=400, detail="Both people must be in this tab")

    settlement = models.Settlement(
        group_id=group_id, 
        from_member=payload.from_member, 
        to_member=payload.to_member, 
        amount=payload.amount,
        created_by_user_id=user.id
    )
    db.add(settlement)
    await balances.apply_settlement(db, settlement)
    await db.commit()
    
    result = await db.execute(select(models.Group).filter(models.Group.id == group_id))
    group = result.scalars().first()
    members_res = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    other_user_ids = [m.user_id for m in members_res.scalars().all() if m.user_id and m.id != member.id]
    if other_user_ids:
        background_tasks.add_task(send_web_push, other_user_ids, group.name, f"{member.name} recorded a settlement of {payload.amount}")

async def remove_member_transaction(group_id: str, target_member_id: str, member: models.Member, db: AsyncSession):
    if member.id != target_member_id and not member.is_admin:
        raise HTTPException(status_code=403, detail="You do not have permission to remove this member")
    
    result = await db.execute(select(models.Member).filter(models.Member.id == target_member_id, models.Member.group_id == group_id))
    target = result.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
        
    net = await balances.compute_net_balances(db, group_id)
    target_balance = net.get(target_member_id, 0.0)
    
    if abs(target_balance) > 0.01:
        msg = "You cannot leave the tab with an unsettled balance" if member.id == target_member_id else "Cannot remove member with an unsettled balance"
        raise HTTPException(status_code=400, detail=msg)
        
    await db.delete(target)
    await db.commit()

async def get_activity_list(group_id: str, limit: int, offset: int, db: AsyncSession):
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    members = result.scalars().all()
    name_lookup = {m.id: m.name for m in members}

    query = text("""
        SELECT 'expense' as type, id, created_at FROM expenses WHERE group_id = :group_id
        UNION ALL
        SELECT 'settlement' as type, id, created_at FROM settlements WHERE group_id = :group_id
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    results = (await db.execute(query, {"group_id": group_id, "limit": limit, "offset": offset})).fetchall()

    expense_ids = [r.id for r in results if r.type == 'expense']
    settlement_ids = [r.id for r in results if r.type == 'settlement']

    expenses_map = {}
    if expense_ids:
        result = await db.execute(
            select(models.Expense).options(selectinload(models.Expense.splits)).filter(models.Expense.id.in_(expense_ids))
        )
        expenses_map = {e.id: e for e in result.scalars().all()}

    settlements_map = {}
    if settlement_ids:
        result = await db.execute(select(models.Settlement).filter(models.Settlement.id.in_(settlement_ids)))
        settlements_map = {s.id: s for s in result.scalars().all()}

    items = []
    for row in results:
        if row.type == 'expense':
            e = expenses_map.get(row.id)
            if not e: continue
            items.append(
                {
                    "type": "expense",
                    "id": e.id,
                    "description": e.description,
                    "category": e.category,
                    "amount": e.amount,
                    "paid_by": e.paid_by,
                    "paid_by_name": name_lookup.get(e.paid_by, "?"),
                    "split_type": e.split_type.value if hasattr(e.split_type, 'value') else str(e.split_type),
                    "created_at": e.created_at,
                    "splits": [
                        {"member_id": s.member_id, "name": name_lookup.get(s.member_id, "?"), "share_amount": s.share_amount}
                        for s in e.splits
                    ],
                }
            )
        elif row.type == 'settlement':
            s = settlements_map.get(row.id)
            if not s: continue
            items.append(
                {
                    "type": "settlement",
                    "id": s.id,
                    "from_member": s.from_member,
                    "from_name": name_lookup.get(s.from_member, "?"),
                    "to_member": s.to_member,
                    "to_name": name_lookup.get(s.to_member, "?"),
                    "amount": s.amount,
                    "created_at": s.created_at,
                    "description": "Settlement",
                    "paid_by_name": name_lookup.get(s.from_member, "?"),
                }
            )

    return items
