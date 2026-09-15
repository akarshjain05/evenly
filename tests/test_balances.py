from app.balances import simplify_debts

def test_simplify_debts_basic():
    net = {"A": 10.0, "B": -10.0}
    transactions = simplify_debts(net)
    assert len(transactions) == 1
    assert transactions[0] == {"from_member": "B", "to_member": "A", "amount": 10.0}

def test_simplify_debts_three_way():
    # A pays for B and C (A spent 30, B owes 10, C owes 10)
    # So A is owed 20, B owes 10, C owes 10
    net = {"A": 20.0, "B": -10.0, "C": -10.0}
    transactions = simplify_debts(net)
    assert len(transactions) == 2
    from_members = {t["from_member"] for t in transactions}
    assert from_members == {"B", "C"}
    for t in transactions:
        assert t["to_member"] == "A"
        assert t["amount"] == 10.0

def test_simplify_debts_chain():
    # A owes B 10, B owes C 10. Net: A=-10, B=0, C=10
    # Should resolve to A pays C 10 directly
    net = {"A": -10.0, "B": 0.0, "C": 10.0}
    transactions = simplify_debts(net)
    assert len(transactions) == 1
    assert transactions[0] == {"from_member": "A", "to_member": "C", "amount": 10.0}

def test_simplify_debts_floating_point():
    # Test rounding issues
    net = {"A": 10.0 / 3, "B": 10.0 / 3, "C": -20.0 / 3}
    transactions = simplify_debts(net)
    # C should pay A and B
    assert len(transactions) == 2
    assert transactions[0]["from_member"] == "C"
    assert transactions[1]["from_member"] == "C"
    amounts = {t["amount"] for t in transactions}
    assert 3.33 in amounts or 3.34 in amounts

from app.balances import process_expense_splits
from app.models import Expense, Member, ExpenseSplit
from app.schemas import ExpenseCreate, SplitInput
from fastapi import HTTPException
import pytest

class MockQuery:
    def __init__(self, members):
        self.members = members
    def filter(self, *args):
        return self
    def all(self):
        return self.members

class MockSession:
    def __init__(self):
        self.added = []
        self.members = [
            Member(id="m1", group_id="g1", name="Alice"),
            Member(id="m2", group_id="g1", name="Bob"),
            Member(id="m3", group_id="g1", name="Charlie")
        ]
    def query(self, model):
        return MockQuery(self.members)
    def add(self, obj):
        self.added.append(obj)

def test_process_expense_equal():
    db = MockSession()
    expense = Expense(id="e1", amount=10.0)
    payload = ExpenseCreate(description="Test", amount=10.0, paid_by="m1", split_type="equal", participant_ids=["m1", "m2", "m3"])
    process_expense_splits(db, "g1", expense, payload)
    
    assert len(db.added) == 3
    amounts = [s.share_amount for s in db.added]
    assert sorted(amounts) == [3.33, 3.33, 3.34]

def test_process_expense_exact():
    db = MockSession()
    expense = Expense(id="e1", amount=10.0)
    payload = ExpenseCreate(description="Test", amount=10.0, paid_by="m1", split_type="exact", splits=[
        SplitInput(member_id="m1", value=4.0),
        SplitInput(member_id="m2", value=6.0)
    ])
    process_expense_splits(db, "g1", expense, payload)
    
    assert len(db.added) == 2
    assert db.added[0].share_amount == 4.0
    assert db.added[1].share_amount == 6.0

def test_process_expense_exact_validation():
    db = MockSession()
    expense = Expense(id="e1", amount=10.0)
    payload = ExpenseCreate(description="Test", amount=10.0, paid_by="m1", split_type="exact", splits=[
        SplitInput(member_id="m1", value=4.0),
        SplitInput(member_id="m2", value=5.0) # Adds up to 9, not 10
    ])
    with pytest.raises(HTTPException):
        process_expense_splits(db, "g1", expense, payload)
