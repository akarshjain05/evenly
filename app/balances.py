import heapq
from typing import Dict, List
from decimal import Decimal

EXACT_SPLIT_TOLERANCE = Decimal('0.02')
PERCENTAGE_TOLERANCE = Decimal('0.5')

from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException

from . import models, schemas


def compute_net_balances(db: Session, group_id: str) -> Dict[str, Decimal]:
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    return {m.id: Decimal(str(m.balance)).quantize(Decimal('0.01')) for m in members}



def simplify_debts(net: Dict[str, Decimal]) -> List[dict]:
    """
    Greedy min-cash-flow settle-up: repeatedly match the biggest creditor
    with the biggest debtor. Not guaranteed to be the mathematical minimum
    number of transactions in every case, but it's a fast, correct, and
    well-known-good heuristic for this problem, and it's what most
    bill-splitting apps use in practice.
    """
    creditors: List[tuple] = []  # max-heap via negated amount: (-amount, member_id)
    debtors: List[tuple] = []  # min-heap on negative amount: (amount, member_id), amount < 0

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

def process_expense_splits(db: Session, group_id: str, expense: models.Expense, payload: schemas.ExpenseCreate):
    valid_ids = {m.id for m in db.query(models.Member).filter(models.Member.group_id == group_id).all()}
    if payload.paid_by not in valid_ids:
        raise HTTPException(status_code=400, detail="Payer is not in this tab")

    splits = []
    
    if payload.split_type == "equal":
        participants = [p for p in (payload.participant_ids or list(valid_ids)) if p in valid_ids]
        if not participants:
            raise HTTPException(status_code=400, detail="Pick at least one person to split with")
        total_amt = Decimal(str(payload.amount))
        num = Decimal(len(participants))
        share = (total_amt / num).quantize(Decimal('0.01'))
        remainder = total_amt - (share * num)
        for i, pid in enumerate(participants):
            amt = share + (remainder if i == 0 else Decimal('0.00'))
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=pid, share_amount=amt))

    elif payload.split_type == "exact":
        if not payload.splits:
            raise HTTPException(status_code=400, detail="Exact split needs an amount per person")
        total = Decimal(str(round(sum(s.value for s in payload.splits), 2)))
        if abs(total - Decimal(str(payload.amount))) > EXACT_SPLIT_TOLERANCE:
            raise HTTPException(status_code=400, detail=f"Splits add up to {total}, not {payload.amount}")
        for s in payload.splits:
            if s.member_id not in valid_ids:
                raise HTTPException(status_code=400, detail="Split includes someone outside this tab")
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=s.member_id, share_amount=Decimal(str(s.value)).quantize(Decimal('0.01'))))

    elif payload.split_type == "percentage":
        if not payload.splits:
            raise HTTPException(status_code=400, detail="Percentage split needs a % per person")
        total_pct = Decimal(str(round(sum(s.value for s in payload.splits), 2)))
        if abs(total_pct - Decimal("100")) > PERCENTAGE_TOLERANCE:
            raise HTTPException(status_code=400, detail=f"Percentages add up to {total_pct}%, not 100%")
        for s in payload.splits:
            if s.member_id not in valid_ids:
                raise HTTPException(status_code=400, detail="Split includes someone outside this tab")
            amt = (Decimal(str(payload.amount)) * Decimal(str(s.value)) / Decimal('100')).quantize(Decimal('0.01'))
            splits.append(models.ExpenseSplit(expense_id=expense.id, member_id=s.member_id, share_amount=amt))

    # Guarantee zero-sum constraint: The total splits MUST exactly equal the expense amount.
    if splits:
        total_splits = sum(s.share_amount for s in splits)
        expense_amt = Decimal(str(payload.amount)).quantize(Decimal('0.01'))
        remainder = expense_amt - total_splits
        if remainder != Decimal('0.00'):
            # Assign the remainder to the payer if they are in the split, otherwise the first person
            payer_split = next((s for s in splits if s.member_id == payload.paid_by), None)
            if payer_split:
                payer_split.share_amount += remainder
            else:
                splits[0].share_amount += remainder

    for split in splits:
        db.add(split)

def apply_expense(db: Session, expense: models.Expense):
    payer = db.get(models.Member, expense.paid_by)
    payer.balance = Decimal(str(payer.balance)) + Decimal(str(expense.amount))
    
    for split in expense.splits:
        sm = db.get(models.Member, split.member_id)
        sm.balance = Decimal(str(sm.balance)) - Decimal(str(split.share_amount))

def revert_expense(db: Session, expense: models.Expense):
    payer = db.get(models.Member, expense.paid_by)
    payer.balance = Decimal(str(payer.balance)) - Decimal(str(expense.amount))
    
    for split in expense.splits:
        sm = db.get(models.Member, split.member_id)
        sm.balance = Decimal(str(sm.balance)) + Decimal(str(split.share_amount))

def apply_settlement(db: Session, settlement: models.Settlement):
    frm = db.get(models.Member, settlement.from_member)
    to = db.get(models.Member, settlement.to_member)
    frm.balance = Decimal(str(frm.balance)) + Decimal(str(settlement.amount))
    to.balance = Decimal(str(to.balance)) - Decimal(str(settlement.amount))

def revert_settlement(db: Session, settlement: models.Settlement):
    frm = db.get(models.Member, settlement.from_member)
    to = db.get(models.Member, settlement.to_member)
    frm.balance = Decimal(str(frm.balance)) - Decimal(str(settlement.amount))
    to.balance = Decimal(str(to.balance)) + Decimal(str(settlement.amount))
