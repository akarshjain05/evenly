from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import dateutil.parser
from decimal import Decimal

from app import models, deps
from app.database import get_db
from app.services.expense_service import process_and_add_expense, process_and_delete_expense, process_and_update_expense
from app.services.settlement_service import process_and_add_settlement, process_and_delete_settlement
from app.schemas import ExpenseCreate, SettlementCreate

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

@router.get("")
async def get_sync(
    since: Optional[str] = None,
    user: models.User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.migrations.add_sync_columns import run_migration
    try:
        await run_migration(db)
        await db.commit()
    except Exception as e:
        print(f"Migration failed lazily: {e}")

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

    since_dt = None
    if since:
        since_dt = dateutil.parser.isoparse(since)

    def apply_since_filter(stmt, model):
        if since_dt:
            return stmt.where(model.updated_at > since_dt)
        return stmt

    groups_stmt = select(models.Group).where(models.Group.id.in_(group_ids))
    groups_stmt = apply_since_filter(groups_stmt, models.Group)
    groups = (await db.execute(groups_stmt)).scalars().all()

    members_stmt = select(models.Member).where(models.Member.group_id.in_(group_ids))
    members_stmt = apply_since_filter(members_stmt, models.Member)
    members = (await db.execute(members_stmt)).scalars().all()

    expenses_stmt = select(models.Expense).where(models.Expense.group_id.in_(group_ids))
    expenses_stmt = apply_since_filter(expenses_stmt, models.Expense)
    expenses = (await db.execute(expenses_stmt)).scalars().all()

    splits_stmt = (
        select(models.ExpenseSplit)
        .join(models.Expense)
        .where(models.Expense.group_id.in_(group_ids))
    )
    splits_stmt = apply_since_filter(splits_stmt, models.ExpenseSplit)
    expense_splits = (await db.execute(splits_stmt)).scalars().all()

    settlements_stmt = select(models.Settlement).where(models.Settlement.group_id.in_(group_ids))
    settlements_stmt = apply_since_filter(settlements_stmt, models.Settlement)
    settlements = (await db.execute(settlements_stmt)).scalars().all()

    return {
        "groups": [serialize_row(r) for r in groups],
        "members": [serialize_row(r) for r in members],
        "expenses": [serialize_row(r) for r in expenses],
        "expense_splits": [serialize_row(r) for r in expense_splits],
        "settlements": [serialize_row(r) for r in settlements],
        "server_timestamp": format_datetime(datetime.now(timezone.utc))
    }

@router.post("/push")
async def push_sync(
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    user: models.User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mutations = payload.get("mutations", [])
    applied = []
    rejected = []

    member_result = await db.execute(
        select(models.Member).where(models.Member.user_id == user.id)
    )
    user_memberships = {m.group_id: m for m in member_result.scalars().all()}
    user_group_ids = set(user_memberships.keys())

    for mutation in mutations:
        table = mutation.get("table")
        action = mutation.get("action")
        entity_id = mutation.get("id")
        data = mutation.get("data", {})
        client_updated_at_str = mutation.get("client_updated_at")
        
        try:
            client_updated_at = dateutil.parser.isoparse(client_updated_at_str) if client_updated_at_str else datetime.now(timezone.utc)
            
            group_id = data.get("group_id")
            if not group_id and action != "create":
                if table == "expenses":
                    model = models.Expense
                elif table == "settlements":
                    model = models.Settlement
                else:
                    raise Exception(f"Unsupported table: {table}")
                    
                entity = (await db.execute(select(model).where(model.id == entity_id))).scalar_one_or_none()
                if entity:
                    group_id = entity.group_id
                    if action == "update" and getattr(entity, "updated_at", None) and entity.updated_at > client_updated_at:
                        rejected.append(entity_id)
                        continue
                else:
                    if action in ("update", "delete"):
                        # Already deleted or missing
                        applied.append(entity_id)
                        continue
                    
            if group_id not in user_group_ids:
                raise Exception("Unauthorized group")
            
            member = user_memberships[group_id]

            if table == "expenses":
                if action == "create":
                    data["id"] = entity_id
                    expense_in = ExpenseCreate(**data)
                    await process_and_add_expense(expense_in, group_id, user, member, db, background_tasks)
                elif action == "update":
                    expense_in = ExpenseCreate(**data)
                    await process_and_update_expense(group_id, entity_id, expense_in, db, member)
                elif action == "delete":
                    await process_and_delete_expense(group_id, entity_id, db, member)

            elif table == "settlements":
                if action == "create":
                    data["id"] = entity_id
                    settlement_in = SettlementCreate(**data)
                    await process_and_add_settlement(settlement_in, group_id, user, member, db, background_tasks)
                elif action == "delete":
                    await process_and_delete_settlement(group_id, entity_id, db, member)

            applied.append(entity_id)
        except Exception as e:
            print(f"Failed to apply mutation {entity_id}: {e}")
            rejected.append(entity_id)
            await db.rollback()
            continue

    return {
        "applied": applied,
        "rejected": rejected,
        "server_timestamp": format_datetime(datetime.now(timezone.utc))
    }
