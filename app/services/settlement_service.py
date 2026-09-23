from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app import models, schemas, balances
from app.services.notification_service import send_web_push

async def process_and_add_settlement(payload: schemas.SettlementCreate, group_id: str, user: models.User, member: models.Member, db: AsyncSession, background_tasks):
    user_id = user.id
    member_id = member_id
    member_name = member.name
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())
    members = result.scalars().all()
    valid_ids = {m.id for m in members}
    if payload.from_member not in valid_ids or payload.to_member not in valid_ids:
        raise HTTPException(status_code=400, detail="Both people must be in this tab")
        
    if not member_is_admin and member_id not in (payload.from_member, payload.to_member):
        raise HTTPException(status_code=403, detail="You can only record settlements you are part of")

    group_name = await db.scalar(select(models.Group.name).filter(models.Group.id == group_id))
    member_name = member.name
    other_user_ids = [m.user_id for m in members if m.user_id and m.id != member_id]

    settlement = models.Settlement(
        id=payload.id if getattr(payload, "id", None) else models.gen_id(),
        group_id=group_id, 
        from_member=payload.from_member, 
        to_member=payload.to_member, 
        amount=payload.amount,
        created_by_user_id=user_id
    )
    db.add(settlement)
    await balances.apply_settlement(db, settlement)
    await db.commit()
    
    if other_user_ids and group_name:
        background_tasks.add_task(send_web_push, other_user_ids, group_name, f"{member_name} recorded a settlement of {payload.amount}")

async def process_and_update_settlement(group_id: str, settlement_id: str, payload: schemas.SettlementCreate, db: AsyncSession, member=None):
    res = await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())
    valid_ids = {m.id for m in res.scalars().all()}

    result = await db.execute(select(models.Settlement).filter(models.Settlement.id == settlement_id, models.Settlement.group_id == group_id).with_for_update())
    settlement = result.scalars().first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if member and not member.is_admin and settlement.created_by_user_id != user_id and settlement.from_member != member_id and settlement.to_member != member_id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this settlement")
        
    if payload.from_member not in valid_ids or payload.to_member not in valid_ids:
        raise HTTPException(status_code=400, detail="Both people must be in this tab")
        
    if not member_is_admin and member_id not in (payload.from_member, payload.to_member):
        raise HTTPException(status_code=403, detail="You can only record settlements you are part of")
        
    await balances.revert_settlement(db, settlement)
    
    settlement.amount = payload.amount
    settlement.from_member = payload.from_member
    settlement.to_member = payload.to_member
    
    await balances.apply_settlement(db, settlement)
    await db.commit()

async def process_and_delete_settlement(group_id: str, settlement_id: str, db: AsyncSession, member: models.Member):
    await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())
    result = await db.execute(select(models.Settlement).filter(models.Settlement.id == settlement_id, models.Settlement.group_id == group_id).with_for_update())
    settlement = result.scalars().first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if not member_is_admin and settlement.created_by_user_id != member_user_id and settlement.from_member != member_id and settlement.to_member != member_id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this settlement")
    await balances.revert_settlement(db, settlement)
    settlement.is_deleted = True
    from datetime import datetime, timezone
    settlement.updated_at = datetime.now(timezone.utc)
    await db.commit()
