from typing import Dict, Any, List, Set
from datetime import datetime, timezone
import dateutil.parser
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import BackgroundTasks
import logging

from app import models
from app.schemas import ExpenseCreate, SettlementCreate
from app.services.expense_service import process_and_add_expense, process_and_delete_expense, process_and_update_expense
from app.services.settlement_service import process_and_add_settlement, process_and_delete_settlement

logger = logging.getLogger(__name__)

async def process_sync_mutations(
    mutations: List[Dict[str, Any]],
    user_group_ids: Set[str],
    user_memberships: Dict[str, models.Member],
    user: models.User,
    db: AsyncSession,
    background_tasks: BackgroundTasks
) -> tuple[List[str], List[str]]:
    applied = []
    rejected = []
    
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
            logger.error("Failed to apply mutation %s: %s", entity_id, e, exc_info=True)
            rejected.append(entity_id)
            await db.rollback()
            continue
            
    return applied, rejected
