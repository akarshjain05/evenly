from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from typing import Any, Dict
from app import models

async def get_activity_list(group_id: str, limit: int, last_seen: str | None, db: AsyncSession):
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    members = result.scalars().all()
    name_lookup = {m.id: m.name for m in members}

    cursor_where = ""
    params: Dict[str, Any] = {"group_id": group_id, "limit": limit}

    if last_seen and '|' in last_seen:
        last_seen_time, last_seen_id = last_seen.split('|', 1)
        cursor_where = "AND (created_at < :last_seen_time OR (created_at = :last_seen_time AND id < :last_seen_id))"
        params["last_seen_time"] = last_seen_time
        params["last_seen_id"] = last_seen_id
    elif last_seen:
        cursor_where = "AND created_at < :last_seen"
        params["last_seen"] = last_seen

    query = text(f'''
        SELECT * FROM (
            SELECT 'expense' as type, id, created_at FROM expenses WHERE group_id = :group_id AND is_deleted = false {cursor_where}
            UNION ALL
            SELECT 'settlement' as type, id, created_at FROM settlements WHERE group_id = :group_id AND is_deleted = false {cursor_where}
        ) AS sub
        ORDER BY created_at DESC, id DESC
        LIMIT :limit
    ''')
    results = (await db.execute(query, params)).fetchall()

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


async def stream_activities_for_export(db: AsyncSession, group_id: str):
    from sqlalchemy import select, literal_column
    from sqlalchemy.orm import selectinload
    from app import models
    from sqlalchemy import union_all, cast, String

    expenses = select(
        models.Expense.created_at.label("created_at"),
        literal_column("'Expense'").label("type"),
        models.Expense.category.label("category"),
        models.Expense.description.label("description"),
        models.Expense.amount.label("amount"),
        models.Expense.paid_by.label("paid_by"),
        cast(models.Expense.split_type, String).label("extra")
    ).where(models.Expense.group_id == group_id, models.Expense.is_deleted == False)

    settlements = select(
        models.Settlement.created_at.label("created_at"),
        literal_column("'Settlement'").label("type"),
        literal_column("NULL").label("category"),
        literal_column("NULL").label("description"),
        models.Settlement.amount.label("amount"),
        models.Settlement.from_member.label("paid_by"),
        models.Settlement.to_member.label("extra")
    ).where(models.Settlement.group_id == group_id, models.Settlement.is_deleted == False)

    query = union_all(expenses, settlements).order_by("created_at")
    
    return await db.stream(query.execution_options(yield_per=1000))
