import traceback
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import io
import csv
from decimal import Decimal

from app import models, schemas, deps, balances
from app.database import get_db
from app.services import group_service
from app.rate_limiter import rate_limit_invite

router = APIRouter(prefix='/api/groups', tags=['groups'])

@router.post("", response_model=schemas.CreateJoinResponse)
async def create_group(payload: schemas.GroupCreate, user: models.User = Depends(deps.get_current_user), db: AsyncSession = Depends(get_db)):
    return await group_service.create_group_transaction(payload, user, db)

@router.get("/by-code/{invite_code}")
async def preview_group(invite_code: str, db: AsyncSession = Depends(get_db), _ = Depends(rate_limit_invite)):
    result = await db.execute(select(models.Group).options(selectinload(models.Group.members)).filter(models.Group.invite_code == invite_code))
    group = result.scalars().first()
    if not group:
        raise HTTPException(status_code=404, detail="No tab found for that code")
    return {"id": group.id, "name": group.name, "member_count": len(group.members)}

@router.post("/by-code/{invite_code}/join", response_model=schemas.CreateJoinResponse)
async def join_group(invite_code: str, payload: schemas.JoinRequest, user: models.User = Depends(deps.get_current_user), db: AsyncSession = Depends(get_db), _ = Depends(rate_limit_invite)):
    return await group_service.join_group_transaction(invite_code, payload, user, db)

@router.get("/{group_id}", response_model=schemas.GroupDetailResponse)
async def get_group(group_id: str, member: models.Member = Depends(deps.get_current_member), db: AsyncSession = Depends(get_db)):
    return await group_service.get_group_details(group_id, db)

@router.put("/{group_id}", response_model=schemas.BasicResponse)
async def update_group(group_id: str, payload: schemas.GroupUpdate, member: models.Member = Depends(deps.get_current_member), db: AsyncSession = Depends(get_db)):
    if not member.is_admin:
        raise HTTPException(status_code=403, detail="Only tab creators can edit the tab name")
    
    result = await db.execute(select(models.Group).filter(models.Group.id == group_id))
    group = result.scalars().first()
    group.name = payload.name
    await db.commit()
    return {"ok": True}

@router.delete("/{group_id}", response_model=schemas.BasicResponse)
async def delete_group(group_id: str, member: models.Member = Depends(deps.get_current_member), db: AsyncSession = Depends(get_db)):
    if not member.is_admin:
        raise HTTPException(status_code=403, detail="Only tab creators can delete the tab")
    
    from sqlalchemy import delete
    
    # 1. Delete all expense splits associated with the group's expenses
    expense_ids_res = await db.execute(select(models.Expense.id).filter(models.Expense.group_id == group_id))
    expense_ids = expense_ids_res.scalars().all()
    if expense_ids:
        await db.execute(delete(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id.in_(expense_ids)))
        
    # 2. Delete all expenses, settlements, and members
    await db.execute(delete(models.Expense).filter(models.Expense.group_id == group_id))
    await db.execute(delete(models.Settlement).filter(models.Settlement.group_id == group_id))
    await db.execute(delete(models.Member).filter(models.Member.group_id == group_id))
    
    # 3. Finally delete the group itself
    await db.execute(delete(models.Group).filter(models.Group.id == group_id))
    await db.commit()
    return {"ok": True}

@router.get("/{group_id}/activity")
async def get_activity(
    group_id: str, 
    limit: int = 50, 
    offset: int = 0, 
    member: models.Member = Depends(deps.get_current_member), 
    db: AsyncSession = Depends(get_db)
):
    return await group_service.get_activity_list(group_id, limit, offset, db)

@router.post("/{group_id}/expenses", response_model=schemas.BasicResponse)
async def add_expense(
    group_id: str,
    payload: schemas.ExpenseCreate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(deps.get_current_user),
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    
    try:
        await group_service.process_and_add_expense(payload, group_id, user, member, db, background_tasks)
    except Exception as e:
        import traceback
        raise HTTPException(status_code=400, detail=traceback.format_exc())

    return {"ok": True}

@router.put("/{group_id}/expenses/{expense_id}", response_model=schemas.BasicResponse)
async def update_expense(
    group_id: str,
    expense_id: str,
    payload: schemas.ExpenseCreate,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.Expense).filter(models.Expense.id == expense_id, models.Expense.group_id == group_id))
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if not member.is_admin and expense.paid_by != member.id:
        raise HTTPException(status_code=403, detail="Only the tab creator or the person who paid can edit this expense")
        
    await balances.revert_expense(db, expense)
    from sqlalchemy import delete
    await db.execute(delete(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id))
    
    expense.description = payload.description
    expense.amount = payload.amount
    expense.paid_by = payload.paid_by
    expense.category = payload.category
    expense.split_type = payload.split_type
    
    await balances.process_expense_splits(db, group_id, expense, payload)
    await db.flush()
    await balances.apply_expense(db, expense)
    await db.commit()
    return {"ok": True}

@router.delete("/{group_id}/expenses/{expense_id}", response_model=schemas.BasicResponse)
async def delete_expense(
    group_id: str,
    expense_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.Expense).filter(models.Expense.id == expense_id, models.Expense.group_id == group_id))
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if not member.is_admin and expense.paid_by != member.id:
        raise HTTPException(status_code=403, detail="Only the tab creator or the person who paid can delete this expense")
    await balances.revert_expense(db, expense)
    await db.delete(expense)
    await db.commit()
    return {"ok": True}

@router.post("/{group_id}/settlements", response_model=schemas.BasicResponse)
async def add_settlement(
    group_id: str,
    payload: schemas.SettlementCreate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(deps.get_current_user),
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    await group_service.process_and_add_settlement(payload, group_id, user, member, db, background_tasks)
    return {"ok": True}

@router.delete("/{group_id}/members/me", response_model=schemas.BasicResponse)
async def leave_group(
    group_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    await group_service.remove_member_transaction(group_id, member.id, member, db)
    return {"ok": True}

@router.delete("/{group_id}/members/{target_member_id}", response_model=schemas.BasicResponse)
async def remove_member(
    group_id: str,
    target_member_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    await group_service.remove_member_transaction(group_id, target_member_id, member, db)
    return {"ok": True}

@router.put("/{group_id}/settlements/{settlement_id}", response_model=schemas.BasicResponse)
async def update_settlement(
    group_id: str,
    settlement_id: str,
    payload: schemas.SettlementCreate,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.Settlement).filter(models.Settlement.id == settlement_id, models.Settlement.group_id == group_id))
    settlement = result.scalars().first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if not member.is_admin and settlement.from_member != member.id and settlement.to_member != member.id:
        raise HTTPException(status_code=403, detail="Only the sender, receiver, or admin can edit this settlement")
    
    res = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    valid_ids = {m.id for m in res.scalars().all()}
    if payload.from_member not in valid_ids or payload.to_member not in valid_ids:
        raise HTTPException(status_code=400, detail="Both people must be in this tab")
        
    await balances.revert_settlement(db, settlement)
    
    settlement.amount = payload.amount
    settlement.from_member = payload.from_member
    settlement.to_member = payload.to_member
    
    await balances.apply_settlement(db, settlement)
    await db.commit()
    return {"ok": True}

@router.delete("/{group_id}/settlements/{settlement_id}", response_model=schemas.BasicResponse)
async def delete_settlement(
    group_id: str,
    settlement_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.Settlement).filter(models.Settlement.id == settlement_id, models.Settlement.group_id == group_id))
    settlement = result.scalars().first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if not member.is_admin and settlement.from_member != member.id and settlement.to_member != member.id:
        raise HTTPException(status_code=403, detail="Only the sender, receiver, or admin can delete this settlement")
        
    await balances.revert_settlement(db, settlement)
    await db.delete(settlement)
    await db.commit()
    return {"ok": True}

@router.get("/{group_id}/export/csv")
async def export_csv(
    group_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Group).filter(models.Group.id == group_id))
    group = result.scalars().first()
    
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    members = result.scalars().all()
    name_lookup = {m.id: m.name for m in members}

    result = await db.execute(select(models.Expense).filter(models.Expense.group_id == group_id))
    expenses = result.scalars().all()
    
    result = await db.execute(select(models.Settlement).filter(models.Settlement.group_id == group_id))
    settlements = result.scalars().all()

    items = []
    for e in expenses:
        items.append({
            "Date": e.created_at.strftime("%Y-%m-%d %H:%M"),
            "Type": "Expense",
            "Category": e.category or "General",
            "Description": e.description,
            "Amount": f"{e.amount:.2f}",
            "Paid By": name_lookup.get(e.paid_by, "?"),
            "Details": f"Split: {e.split_type}"
        })
    for s in settlements:
        items.append({
            "Date": s.created_at.strftime("%Y-%m-%d %H:%M"),
            "Type": "Settlement",
            "Category": "-",
            "Description": "Settlement",
            "Amount": f"{s.amount:.2f}",
            "Paid By": name_lookup.get(s.from_member, "?"),
            "Details": f"Paid to: {name_lookup.get(s.to_member, '?')}"
        })

    items.sort(key=lambda x: x["Date"])

    def iter_csv():
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["Date", "Type", "Category", "Description", "Amount", "Paid By", "Details"])
        writer.writeheader()
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        for item in items:
            writer.writerow(item)
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    filename = f"{group.name.replace(' ', '_')}_export.csv"
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
