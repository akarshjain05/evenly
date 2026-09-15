import heapq
from typing import Dict, List

from sqlalchemy.orm import Session

from . import models


def compute_net_balances(db: Session, group_id: str) -> Dict[str, float]:
    """
    Positive net = this person is owed money overall.
    Negative net = this person owes money overall.
    """
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    net = {m.id: 0.0 for m in members}

    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
    for expense in expenses:
        net[expense.paid_by] = net.get(expense.paid_by, 0.0) + expense.amount
        for split in expense.splits:
            net[split.member_id] = net.get(split.member_id, 0.0) - split.share_amount

    settlements = db.query(models.Settlement).filter(models.Settlement.group_id == group_id).all()
    for s in settlements:
        # from_member paid to_member, so from_member's debt shrinks (net moves up)
        # and to_member has now been paid back (net moves down).
        net[s.from_member] = net.get(s.from_member, 0.0) + s.amount
        net[s.to_member] = net.get(s.to_member, 0.0) - s.amount

    return {member_id: round(amount, 2) for member_id, amount in net.items()}


def simplify_debts(net: Dict[str, float]) -> List[dict]:
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
        if amount > 0.01:
            heapq.heappush(creditors, (-amount, member_id))
        elif amount < -0.01:
            heapq.heappush(debtors, (amount, member_id))

    transactions: List[dict] = []

    while creditors and debtors:
        neg_credit, creditor_id = heapq.heappop(creditors)
        neg_debt, debtor_id = heapq.heappop(debtors)
        credit_amt = -neg_credit
        debt_amt = -neg_debt

        pay = round(min(credit_amt, debt_amt), 2)
        if pay > 0.01:
            transactions.append({"from_member": debtor_id, "to_member": creditor_id, "amount": pay})

        remaining_credit = round(credit_amt - pay, 2)
        remaining_debt = round(debt_amt - pay, 2)

        if remaining_credit > 0.01:
            heapq.heappush(creditors, (-remaining_credit, creditor_id))
        if remaining_debt > 0.01:
            heapq.heappush(debtors, (-remaining_debt, debtor_id))

    return transactions
