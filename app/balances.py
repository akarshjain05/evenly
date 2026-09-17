import heapq
from typing import Dict, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from . import models, schemas

EXACT_SPLIT_TOLERANCE = Decimal('0.02')
PERCENTAGE_TOLERANCE = Decimal('0.5')

async def compute_net_balances(db: AsyncSession, group_id: str) -> Dict[str, Decimal]:
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    members = result.scalars().all()
    return {m.id: m.balance.quantize(Decimal('0.01')) for m in members}

def simplify_debts(net: Dict[str, Decimal]) -> List[dict]:
    creditors: List[tuple] = []
    debtors: List[tuple] = []

    for member_id, amount in net.items():
        if amount > Decimal('0.01'):
            heapq.heappush(creditors, (-amount, member_id))
        elif amount < Decimal('-0.01'):
            heapq.heappush(debtors, (amount, member_id))

    transactions: List[dict] = []

    while creditors and debtors:
        neg_credit, creditor_id = heapq.heappop(creditors)
        neg_debt, debtor_id = heapq.heappop(debtors)
        credit_amt = -neg_credit
        debt_amt = -neg_debt

        pay = min(credit_amt, debt_amt).quantize(Decimal('0.01'))
        if pay > Decimal('0.01'):
            transactions.append({"from_member": debtor_id, "to_member": creditor_id, "amount": pay})

        remaining_credit = (credit_amt - pay).quantize(Decimal('0.01'))
        remaining_debt = (debt_amt - pay).quantize(Decimal('0.01'))

        if remaining_credit > Decimal('0.01'):
            heapq.heappush(creditors, (-remaining_credit, creditor_id))
        if remaining_debt > Decimal('0.01'):
            heapq.heappush(debtors, (-remaining_debt, debtor_id))

    return transactions

async def process_expense_splits(db: AsyncSession, group_id: str, expense: models.Expense, payload: schemas.ExpenseCreate):
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    valid_ids = {m.id for m in result.scalars().all()}
    
    if payload.paid_by not in valid_ids:
        raise HTTPException(status_code=400, detail="Payer is not in this tab")

    splits = []
    
    if payload.split_type == "equal":
        participants = [p for p in (payload.participant_ids or list(valid_ids)) if p in valid_ids]
        if not participants:
            raise HTTPException(status_code=400, detail="Pick at least one person to split with")
        
        num = Decimal(len(participants))
        share = (payload.amount / num).quantize(Decimal('0.01'))
        remainder = payload.amount - (share * num)
        for i, pid in enumerate(participants):
            amt = share + (remainder if i == 0 else Decimal('0.00'))
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=pid, share_amount=amt))

    elif payload.split_type == "exact":
        if not payload.splits:
            raise HTTPException(status_code=400, detail="Exact split needs an amount per person")
        
        total = sum(s.value for s in payload.splits)
        if abs(total - payload.amount) > EXACT_SPLIT_TOLERANCE:
            raise HTTPException(status_code=400, detail=f"Splits add up to {total}, not {payload.amount}")
            
        for s in payload.splits:
            if s.member_id not in valid_ids:
                raise HTTPException(status_code=400, detail="Split includes someone outside this tab")
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=s.member_id, share_amount=s.value.quantize(Decimal('0.01'))))

    elif payload.split_type == "percentage":
        if not payload.splits:
            raise HTTPException(status_code=400, detail="Percentage split needs a % per person")
            
        total_pct = sum(s.value for s in payload.splits)
        if abs(total_pct - Decimal("100")) > PERCENTAGE_TOLERANCE:
            raise HTTPException(status_code=400, detail=f"Percentages add up to {total_pct}%, not 100%")
            
        for s in payload.splits:
            if s.member_id not in valid_ids:
                raise HTTPException(status_code=400, detail="Split includes someone outside this tab")
            amt = (payload.amount * s.value / Decimal('100')).quantize(Decimal('0.01'))
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=s.member_id, share_amount=amt))

    if splits:
        total_splits = sum(s.share_amount for s in splits)
        remainder = payload.amount.quantize(Decimal('0.01')) - total_splits
        if remainder != Decimal('0.00'):
            payer_split = next((s for s in splits if s.member_id == payload.paid_by), None)
            if payer_split:
                payer_split.share_amount += remainder
            else:
                splits[0].share_amount += remainder

    for split in splits:
        db.add(split)

async def apply_expense(db: AsyncSession, expense: models.Expense):
    from sqlalchemy import update
    await db.execute(select(models.Member).filter(models.Member.id == expense.paid_by).with_for_update())
    await db.execute(update(models.Member).filter(models.Member.id == expense.paid_by).values(balance=models.Member.balance + expense.amount))
    for split in expense.splits:
        await db.execute(update(models.Member).filter(models.Member.id == split.member_id).values(balance=models.Member.balance - split.share_amount))

async def revert_expense(db: AsyncSession, expense: models.Expense):
    from sqlalchemy import update
    await db.execute(update(models.Member).filter(models.Member.id == expense.paid_by).values(balance=models.Member.balance - expense.amount))
    for split in expense.splits:
        await db.execute(update(models.Member).filter(models.Member.id == split.member_id).values(balance=models.Member.balance + split.share_amount))

async def apply_settlement(db: AsyncSession, settlement: models.Settlement):
    from sqlalchemy import update
    await db.execute(update(models.Member).filter(models.Member.id == settlement.from_member).values(balance=models.Member.balance + settlement.amount))
    await db.execute(update(models.Member).filter(models.Member.id == settlement.to_member).values(balance=models.Member.balance - settlement.amount))

async def revert_settlement(db: AsyncSession, settlement: models.Settlement):
    from sqlalchemy import update
    await db.execute(update(models.Member).filter(models.Member.id == settlement.from_member).values(balance=models.Member.balance - settlement.amount))
    await db.execute(update(models.Member).filter(models.Member.id == settlement.to_member).values(balance=models.Member.balance + settlement.amount))
