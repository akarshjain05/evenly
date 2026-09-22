import heapq
from typing import Dict, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .exceptions import InvalidSplitError
from . import models, schemas

EXACT_SPLIT_TOLERANCE = Decimal('0.02')
PERCENTAGE_TOLERANCE = Decimal('0.5')

# Minimum threshold for a debt to be considered non-zero
SETTLEMENT_TOLERANCE = Decimal('0.01')

async def compute_net_balances(db: AsyncSession, group_id: str) -> Dict[str, Decimal]:
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    members = result.scalars().all()
    return {m.id: m.balance.quantize(Decimal('0.01')) for m in members}

# IMPORTANT: The debt-simplification algorithm is duplicated intentionally for Optimistic UI!
# This Python implementation (using min-heaps) MUST be kept in sync with the TypeScript 
# implementation in `frontend/src/utils/balances.ts`.
# Any changes to rounding, thresholds, or matching logic must be mirrored there.
def simplify_debts(net: Dict[str, Decimal]) -> List[dict]:
    creditors: List[tuple] = []
    debtors: List[tuple] = []

    for member_id, amount in net.items():
        if amount > SETTLEMENT_TOLERANCE:
            heapq.heappush(creditors, (-amount, member_id))
        elif amount < -SETTLEMENT_TOLERANCE:
            heapq.heappush(debtors, (amount, member_id))

    transactions: List[dict] = []

    while creditors and debtors:
        neg_credit, creditor_id = heapq.heappop(creditors)
        neg_debt, debtor_id = heapq.heappop(debtors)
        credit_amt = -neg_credit
        debt_amt = -neg_debt

        pay = min(credit_amt, debt_amt).quantize(Decimal('0.01'))
        if pay > SETTLEMENT_TOLERANCE:
            transactions.append({"from_member": debtor_id, "to_member": creditor_id, "amount": pay})

        remaining_credit = (credit_amt - pay).quantize(Decimal('0.01'))
        remaining_debt = (debt_amt - pay).quantize(Decimal('0.01'))

        if remaining_credit > SETTLEMENT_TOLERANCE:
            heapq.heappush(creditors, (-remaining_credit, creditor_id))
        if remaining_debt > SETTLEMENT_TOLERANCE:
            heapq.heappush(debtors, (-remaining_debt, debtor_id))

    return transactions

async def process_expense_splits(db: AsyncSession, group_id: str, expense: models.Expense, payload: schemas.ExpenseCreate, valid_ids: set | None = None) -> None:
    if valid_ids is None:
        result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
        valid_ids = {m.id for m in result.scalars().all()}
    
    if payload.paid_by not in valid_ids:
        raise InvalidSplitError("Payer is not in this tab")

    splits = []
    
    if payload.split_type == "equal":
        participants = [p for p in (payload.participant_ids or list(valid_ids)) if p in valid_ids]
        if not participants:
            raise InvalidSplitError("Pick at least one person to split with")
        
        num = Decimal(len(participants))
        share = (payload.amount / num).quantize(Decimal('0.01'))
        for pid in participants:
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=pid, share_amount=share))

    elif payload.split_type == "exact":
        if not payload.splits:
            raise InvalidSplitError("Exact split needs an amount per person")
        
        total = sum(s.value for s in payload.splits)
        if abs(total - payload.amount) > EXACT_SPLIT_TOLERANCE:
            raise InvalidSplitError(f"Splits add up to {total}, not {payload.amount}")
            
        for s in payload.splits:
            if s.member_id not in valid_ids:
                raise InvalidSplitError("Split includes someone outside this tab")
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=s.member_id, share_amount=s.value.quantize(Decimal('0.01'))))

    elif payload.split_type == "percentage":
        if not payload.splits:
            raise InvalidSplitError("Percentage split needs a % per person")
            
        total_pct = sum(s.value for s in payload.splits)
        if abs(total_pct - Decimal("100")) > PERCENTAGE_TOLERANCE:
            raise InvalidSplitError(f"Percentages add up to {total_pct}%, not 100%")
            
        for s in payload.splits:
            if s.member_id not in valid_ids:
                raise InvalidSplitError("Split includes someone outside this tab")
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

    await db.flush()
    for split in splits:
        db.add(split)

async def apply_expense(db: AsyncSession, expense: models.Expense) -> None:
    from sqlalchemy import update, func, case, func
    await db.execute(update(models.Member).filter(models.Member.id == expense.paid_by).values(balance=models.Member.balance + expense.amount, updated_at=func.now()))
    result = await db.execute(select(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id))
    splits = result.scalars().all()
    await db.flush()
    if splits:
        whens = {split.member_id: split.share_amount for split in splits}
        member_ids = list(whens.keys())
        share_case = case(whens, value=models.Member.id)
        await db.execute(
            update(models.Member)
            .filter(models.Member.id.in_(member_ids))
            .values(balance=models.Member.balance - share_case, updated_at=func.now())
        )

async def revert_expense(db: AsyncSession, expense: models.Expense) -> None:
    from sqlalchemy import update, func, case, func
    await db.execute(update(models.Member).filter(models.Member.id == expense.paid_by).values(balance=models.Member.balance - expense.amount, updated_at=func.now()))
    result = await db.execute(select(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id))
    splits = result.scalars().all()
    await db.flush()
    if splits:
        whens = {split.member_id: split.share_amount for split in splits}
        member_ids = list(whens.keys())
        share_case = case(whens, value=models.Member.id)
        await db.execute(
            update(models.Member)
            .filter(models.Member.id.in_(member_ids))
            .values(balance=models.Member.balance + share_case, updated_at=func.now())
        )

async def apply_settlement(db: AsyncSession, settlement: models.Settlement) -> None:
    from sqlalchemy import update, func
    await db.execute(update(models.Member).filter(models.Member.id == settlement.from_member).values(balance=models.Member.balance + settlement.amount, updated_at=func.now()))
    await db.execute(update(models.Member).filter(models.Member.id == settlement.to_member).values(balance=models.Member.balance - settlement.amount, updated_at=func.now()))

async def revert_settlement(db: AsyncSession, settlement: models.Settlement) -> None:
    from sqlalchemy import update, func
    await db.execute(update(models.Member).filter(models.Member.id == settlement.from_member).values(balance=models.Member.balance - settlement.amount, updated_at=func.now()))
    await db.execute(update(models.Member).filter(models.Member.id == settlement.to_member).values(balance=models.Member.balance + settlement.amount, updated_at=func.now()))

async def recompute_balances_from_ledger(db: AsyncSession, group_id: str) -> None:
    from sqlalchemy import select, func, update, case
    
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id))
    members = result.scalars().all()
    if not members:
        return
        
    true_balances = {m.id: Decimal('0.00') for m in members}
    from sqlalchemy import text
    query = text('''
        SELECT member_id, SUM(amount) as net_balance FROM (
            SELECT paid_by as member_id, amount FROM expenses WHERE group_id = :group_id AND is_deleted = false
            UNION ALL
            SELECT s.member_id, -s.share_amount as amount FROM expense_splits s 
            JOIN expenses e ON e.id = s.expense_id WHERE e.group_id = :group_id AND e.is_deleted = false
            UNION ALL
            SELECT from_member as member_id, amount FROM settlements WHERE group_id = :group_id AND is_deleted = false
            UNION ALL
            SELECT to_member as member_id, -amount FROM settlements WHERE group_id = :group_id AND is_deleted = false
        ) as ledger
        WHERE member_id IS NOT NULL
        GROUP BY member_id
    ''')
    result = await db.execute(query, {"group_id": group_id})
    for row in result.all():
        if row.member_id in true_balances and row.net_balance is not None:
            true_balances[row.member_id] = Decimal(str(row.net_balance))
            
    # Bulk update balances
    updates = []
    for m in members:
        if m.balance != true_balances[m.id]:
            updates.append({"id": m.id, "balance": true_balances[m.id]})
            
    if updates:
        from sqlalchemy import bindparam
        stmt = update(models.Member).where(models.Member.id == bindparam('b_id')).values(balance=bindparam('b_balance', updated_at=func.now()))
        await db.execute(stmt, [{'b_id': u['id'], 'b_balance': u['balance']} for u in updates])