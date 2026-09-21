from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app import models, schemas, balances
from app.services.notification_service import send_web_push

async def process_and_add_expense(payload: schemas.ExpenseCreate, group_id: str, user: models.User, member: models.Member, db: AsyncSession, background_tasks):
    members_res = await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())
    members = members_res.scalars().all()
    other_user_ids = [m.user_id for m in members if m.user_id and m.id != member.id]
    group_name = await db.scalar(select(models.Group.name).filter(models.Group.id == group_id))
    
    expense = models.Expense(
        group_id=group_id,
        description=payload.description,
        amount=payload.amount,
        paid_by=payload.paid_by,
        category=payload.category,
        split_type=models.SplitType(payload.split_type),
        created_by_user_id=user.id
    )
    db.add(expense)
    await db.flush()
    member_ids = {m.id for m in members}
    await balances.process_expense_splits(db, group_id, expense, payload, valid_ids=member_ids)
    await db.flush()
    await balances.apply_expense(db, expense)
    
    message = f"{member.name} added a new expense: {payload.description}"
    await db.commit()

    if other_user_ids and group_name:
        background_tasks.add_task(send_web_push, other_user_ids, group_name, message)

async def process_and_update_expense(group_id: str, expense_id: str, payload: schemas.ExpenseCreate, db: AsyncSession, member: models.Member):
    members_res = await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())
    members = members_res.scalars().all()
    
    result = await db.execute(select(models.Expense).filter(models.Expense.id == expense_id, models.Expense.group_id == group_id).with_for_update())
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if not member.is_admin and expense.created_by_user_id != member.user_id and expense.paid_by != member.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this expense")

    await balances.revert_expense(db, expense)
    
    from sqlalchemy import delete
    await db.execute(delete(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id))
    
    expense.description = payload.description
    expense.amount = payload.amount
    expense.paid_by = payload.paid_by
    expense.category = payload.category
    expense.split_type = payload.split_type
    
    member_ids = {m.id for m in members}
    await balances.process_expense_splits(db, group_id, expense, payload, valid_ids=member_ids)
    await db.flush()
    await balances.apply_expense(db, expense)
    await db.commit()

async def process_and_delete_expense(group_id: str, expense_id: str, db: AsyncSession, member: models.Member):
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
