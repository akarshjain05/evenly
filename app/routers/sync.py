from fastapi import APIRouter, Depends, Body, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import dateutil.parser
from decimal import Decimal
import logging

from app import models, deps
from app.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sync", tags=["sync"])

def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.isoformat()

def serialize_row(row) -> Dict[str, Any]:
    result = {}
    for column in row.__table__.columns:
        val = getattr(row, column.name)
        
        # Fallback for updated_at if it's somehow missing/null on old records
        if column.name == "updated_at" and val is None:
            val = getattr(row, "created_at", None)
            if val is None:
                val = datetime(2000, 1, 1, tzinfo=timezone.utc)
                
        if isinstance(val, Decimal):
            result[column.name] = float(val)
        elif isinstance(val, datetime):
            result[column.name] = format_datetime(val)
        else:
            result[column.name] = val
    return result

@router.post("/run-migration")
async def explicit_migration(db: AsyncSession = Depends(get_db)):
    from app.migrations.add_sync_columns import run_migration
    try:
        await run_migration(db)
        await db.commit()
        return {"status": "ok"}
    except Exception as e:
        await db.rollback()
        import traceback
        return {"status": "error", "error": str(e), "traceback": traceback.format_exc()}

@router.get("")
async def get_sync(
    since: Optional[str] = None,
    user: models.User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Lazy migration removed. We will run it via a dedicated endpoint.

    result = await db.execute(
        select(models.Member.group_id).where(models.Member.user_id == user.id)
    )
    group_ids = [row[0] for row in result.all()]

    if not group_ids:
        return {
            "groups": [],
            "members": [],
            "expenses": [],
            "expense_splits": [],
            "settlements": [],
            "server_timestamp": format_datetime(datetime.now(timezone.utc))
        }

    # Auto-reconcile on full sync to heal corrupted balances from past bugs
    if not since:
        from app import balances
        for g_id in group_ids:
            await balances.recompute_balances_from_ledger(db, g_id)
        await db.commit()

    since_dt = None
    if since:
        since_dt = dateutil.parser.isoparse(since)

    def apply_since_filter(stmt, model):
        if since_dt:
            return stmt.where(model.updated_at > since_dt)
        return stmt

    groups_stmt = select(models.Group).where(models.Group.id.in_(group_ids))
    groups_stmt = apply_since_filter(groups_stmt, models.Group)
    groups = (await db.execute(groups_stmt.limit(5000))).scalars().all()

    members_stmt = select(models.Member).where(models.Member.group_id.in_(group_ids))
    members_stmt = apply_since_filter(members_stmt, models.Member)
    members = (await db.execute(members_stmt.limit(5000))).scalars().all()

    expenses_stmt = select(models.Expense).where(models.Expense.group_id.in_(group_ids))
    expenses_stmt = apply_since_filter(expenses_stmt, models.Expense)
    expenses = (await db.execute(expenses_stmt.limit(5000))).scalars().all()

    splits_stmt = (
        select(models.ExpenseSplit)
        .join(models.Expense)
        .where(models.Expense.group_id.in_(group_ids))
    )
    splits_stmt = apply_since_filter(splits_stmt, models.ExpenseSplit)
    expense_splits = (await db.execute(splits_stmt.limit(5000))).scalars().all()

    settlements_stmt = select(models.Settlement).where(models.Settlement.group_id.in_(group_ids))
    settlements_stmt = apply_since_filter(settlements_stmt, models.Settlement)
    settlements = (await db.execute(settlements_stmt.limit(5000))).scalars().all()

    return {
        "groups": [serialize_row(r) for r in groups],
        "members": [serialize_row(r) for r in members],
        "expenses": [serialize_row(r) for r in expenses],
        "expense_splits": [serialize_row(r) for r in expense_splits],
        "settlements": [serialize_row(r) for r in settlements],
        "server_timestamp": format_datetime(datetime.now(timezone.utc))
    }

from app.services.sync_service import process_sync_mutations

@router.post("/push")
async def push_sync(
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    user: models.User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mutations = payload.get("mutations", [])

    member_result = await db.execute(
        select(models.Member).where(models.Member.user_id == user.id)
    )
    user_memberships = {m.group_id: m for m in member_result.scalars().all()}
    user_group_ids = set(user_memberships.keys())

    applied, rejected = await process_sync_mutations(
        mutations, user_group_ids, user_memberships, user, db, background_tasks
    )
    
    # Auto-reconcile to heal corrupted balances from past bugs
    from app import balances
    affected_groups = {m.get("data", {}).get("group_id") or m.get("group_id") for m in mutations}
    affected_groups = {g for g in affected_groups if g in user_group_ids}
    for g_id in affected_groups:
        await balances.recompute_balances_from_ledger(db, g_id)
        
    await db.commit()

    return {
        "applied": applied,
        "rejected": rejected,
        "server_timestamp": format_datetime(datetime.now(timezone.utc))
    }
