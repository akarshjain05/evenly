import urllib.parse
import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Query
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from typing import List
import io
import csv
from decimal import Decimal

from app import models, schemas, deps, balances
from app.database import get_db
from app.services import group_service
from app.rate_limiter import rate_limit_invite, rate_limit_export

router = APIRouter(prefix='/api/groups', tags=['groups'])
logger = logging.getLogger(__name__)

@router.post("", response_model=schemas.CreateJoinResponse)
async def create_group(payload: schemas.GroupCreate, user: models.User = Depends(deps.get_current_user), db: AsyncSession = Depends(get_db)):
    return await group_service.create_group_transaction(payload, user, db)

@router.get("/by-code/{invite_code}")
async def preview_group(invite_code: str, user: models.User = Depends(deps.get_current_user), db: AsyncSession = Depends(get_db), _ = Depends(rate_limit_invite)):
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
    user_id = member.user_id
    group.name = payload.name
    await db.commit()
    logger.info("User %s renamed group %s to '%s'", user_id, group_id, payload.name)
    return await group_service.get_group_details(group_id, db)

@router.delete("/{group_id}", response_model=schemas.BasicResponse)
async def delete_group(group_id: str, member: models.Member = Depends(deps.get_current_member), db: AsyncSession = Depends(get_db)):
    if not member.is_admin:
        raise HTTPException(status_code=403, detail="Only tab creators can delete the tab")
    
    # Let SQLAlchemy's cascade="all, delete-orphan" handle the heavy lifting
    result = await db.execute(select(models.Group).filter(models.Group.id == group_id))
    group = result.scalars().first()
    if group:
        await db.delete(group)
        await db.commit()
    
    return {"ok": True}

@router.get("/{group_id}/activity")
async def get_activity(
    group_id: str, 
    limit: int = Query(50, le=100), 
    last_seen: str | None = None, 
    member: models.Member = Depends(deps.get_current_member), 
    db: AsyncSession = Depends(get_db)
):
    # PERFORMANCE NOTE:
    # Every group-detail fetch synchronously recomputes the full O(N) debt simplification 
    # across all members on the fly via balances.simplify_debts.
    # This design is optimized for "a few people" (e.g. 5-10 friends). 
    # It will become a latency bottleneck for a "50-person shared house" since group size is currently unbounded.
    # If scaling up, consider caching simplified_debts in the DB and updating it asynchronously.
    return await group_service.get_activity_list(group_id, limit, last_seen, db)

@router.post("/{group_id}/expenses", response_model=schemas.GroupDetailResponse)
async def add_expense(
    group_id: str,
    payload: schemas.ExpenseCreate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(deps.get_current_user),
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    user_id = user.id
    await group_service.process_and_add_expense(payload, group_id, user, member, db, background_tasks)
    logger.info("User %s added expense to group %s for amount %s", user_id, group_id, payload.amount)
    return await group_service.get_group_details(group_id, db)

@router.put("/{group_id}/expenses/{expense_id}", response_model=schemas.GroupDetailResponse)
async def update_expense(
    group_id: str,
    expense_id: str,
    payload: schemas.ExpenseCreate,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    # Lock member balances first to prevent deadlocks and race conditions
    await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())
    
    result = await db.execute(select(models.Expense).filter(models.Expense.id == expense_id, models.Expense.group_id == group_id).with_for_update())
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if not member.is_admin and expense.created_by_user_id != member.user_id and expense.paid_by != member.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this expense")
    
    await group_service.process_and_update_expense(expense, payload, group_id, db)
    await db.commit()
    return await group_service.get_group_details(group_id, db)

@router.delete("/{group_id}/expenses/{expense_id}", response_model=schemas.GroupDetailResponse)
async def delete_expense(
    group_id: str,
    expense_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    # Lock member balances first to prevent deadlocks and race conditions
    await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())
    
    result = await db.execute(select(models.Expense).filter(models.Expense.id == expense_id, models.Expense.group_id == group_id).with_for_update())
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if not member.is_admin and expense.created_by_user_id != member.user_id and expense.paid_by != member.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this expense")
    await balances.revert_expense(db, expense)
    await db.delete(expense)
    await db.commit()
    return await group_service.get_group_details(group_id, db)

@router.post("/{group_id}/settlements", response_model=schemas.GroupDetailResponse)
async def add_settlement(
    group_id: str,
    payload: schemas.SettlementCreate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(deps.get_current_user),
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    await group_service.process_and_add_settlement(payload, group_id, user, member, db, background_tasks)
    return await group_service.get_group_details(group_id, db)

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

@router.put("/{group_id}/settlements/{settlement_id}", response_model=schemas.GroupDetailResponse)
async def update_settlement(
    group_id: str,
    settlement_id: str,
    payload: schemas.SettlementCreate,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    user_id = member.user_id
    await group_service.process_and_update_settlement(group_id, settlement_id, payload, db, member)
    logger.info("User %s updated settlement %s in group %s", user_id, settlement_id, group_id)
    return await group_service.get_group_details(group_id, db)

@router.delete("/{group_id}/settlements/{settlement_id}", response_model=schemas.GroupDetailResponse)
async def delete_settlement(
    group_id: str,
    settlement_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())
    result = await db.execute(select(models.Settlement).filter(models.Settlement.id == settlement_id, models.Settlement.group_id == group_id).with_for_update())
    settlement = result.scalars().first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    if not member.is_admin and settlement.created_by_user_id != member.user_id and settlement.from_member != member.id and settlement.to_member != member.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this settlement")
    await balances.revert_settlement(db, settlement)
    await db.delete(settlement)
    await db.commit()
    return await group_service.get_group_details(group_id, db)

@router.get("/{group_id}/export/csv")
async def export_csv(
    group_id: str,
    member: models.Member = Depends(deps.get_current_member),
    db: AsyncSession = Depends(get_db),
    _ = Depends(rate_limit_export)
):
    result = await db.execute(select(models.Group).filter(models.Group.id == group_id))
    group = result.scalars().first()
    
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    members = result.scalars().all()
    name_lookup = {m.id: m.name for m in members}

    async def iter_csv():
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["Date", "Type", "Category", "Description", "Amount", "Paid By", "Details"])
        writer.writeheader()
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        query = text('''
            SELECT 
                created_at, 
                'Expense' as type, 
                category,
                description, 
                amount, 
                paid_by, 
                split_type as extra
            FROM expenses WHERE group_id = :group_id
            UNION ALL
            SELECT 
                created_at, 
                'Settlement' as type, 
                NULL as category,
                NULL as description, 
                amount, 
                from_member as paid_by, 
                to_member as extra
            FROM settlements WHERE group_id = :group_id
            ORDER BY created_at ASC
        ''')
        
        async_result = await db.stream(query.execution_options(yield_per=1000), {"group_id": group_id})
        async for row in async_result:
            if isinstance(row.created_at, str):
                date_str = row.created_at[:16].replace('T', ' ')
            else:
                date_str = row.created_at.strftime("%Y-%m-%d %H:%M")
            if row.type == 'Expense':
                details = f"Split: {row.extra}"
                desc = row.description
                cat = row.category or "General"
            else:
                details = f"Paid to: {name_lookup.get(row.extra, '?')}"
                desc = "Settlement"
                cat = "-"

            writer.writerow({
                "Date": date_str,
                "Type": row.type,
                "Category": cat,
                "Description": desc,
                "Amount": f"{row.amount:.2f}",
                "Paid By": name_lookup.get(row.paid_by, "?"),
                "Details": details
            })
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    filename = f"{urllib.parse.quote(group.name.replace(' ', '_'))}_export.csv"
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.post("/{group_id}/reconcile", response_model=schemas.GroupDetailResponse)
async def reconcile_balances(group_id: str, member: models.Member = Depends(deps.get_current_member), db: AsyncSession = Depends(get_db)):
    """
    Admin endpoint to recalculate all member balances directly from the underlying ledger
    (expenses and settlements). Fixes any drift caused by aborted transactions or manual edits.
    """
    if not member.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can manually reconcile the ledger")

    # Acquire row locks on all members to prevent concurrent mutations during recomputation
    await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())

    await balances.recompute_balances_from_ledger(db, group_id)
    await db.commit()
    
    # Return the fully refreshed group details
    return await group_service.get_group_details(group_id, db)
