from decimal import Decimal
from app.balances import simplify_debts

def test_simplify_debts_basic():
    net = {"A": Decimal("10.0"), "B": Decimal("-10.0")}
    transactions = simplify_debts(net)
    assert len(transactions) == 1
    assert transactions[0] == {"from_member": "B", "to_member": "A", "amount": 10.0}

def test_simplify_debts_three_way():
    # A pays for B and C (A spent 30, B owes 10, C owes 10)
    # So A is owed 20, B owes 10, C owes 10
    net = {"A": Decimal("20.0"), "B": Decimal("-10.0"), "C": Decimal("-10.0")}
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
    net = {"A": Decimal('-10.0'), "B": Decimal('0.0'), "C": Decimal('10.0')}
    transactions = simplify_debts(net)
    assert len(transactions) == 1
    assert transactions[0] == {"from_member": "A", "to_member": "C", "amount": 10.0}

def test_simplify_debts_floating_point():
    # Test rounding issues
    net = {"A": Decimal('3.33'), "B": Decimal('3.33'), "C": Decimal('-6.66')}
    transactions = simplify_debts(net)
    # C should pay A and B
    assert len(transactions) == 2
    assert transactions[0]["from_member"] == "C"
    assert transactions[1]["from_member"] == "C"
    amounts = {t["amount"] for t in transactions}
    assert Decimal("3.33") in amounts or Decimal("3.34") in amounts

from app.balances import process_expense_splits
from app.models import Expense, Member, ExpenseSplit
from app.schemas import ExpenseCreate, SplitInput
from fastapi import HTTPException
import pytest

class MockResult:
    def __init__(self, members):
        self.members = members
    def scalars(self):
        class MockScalars:
            def __init__(self, items):
                self.items = items
            def all(self):
                return self.items
        return MockScalars(self.members)

class MockSession:
    def __init__(self):
        self.added = []
        self.members = [
            Member(id="m1", group_id="g1", name="Alice", balance=Decimal("0")),
            Member(id="m2", group_id="g1", name="Bob", balance=Decimal("0")),
            Member(id="m3", group_id="g1", name="Charlie", balance=Decimal("0"))
        ]
    async def flush(self):
        pass
    async def execute(self, statement):
        return MockResult(self.members)
    def add(self, obj):
        self.added.append(obj)

@pytest.mark.asyncio
async def test_process_expense_equal():
    db = MockSession()
    expense = Expense(id="e1", amount=10.0)
    payload = ExpenseCreate(description="Test", amount=10.0, paid_by="m1", split_type="equal", participant_ids=["m1", "m2", "m3"])
    await process_expense_splits(db, "g1", expense, payload)
    
    assert len(db.added) == 3
    amounts = [s.share_amount for s in db.added]
    assert sorted(amounts) == [Decimal('3.33'), Decimal('3.33'), Decimal('3.34')]

@pytest.mark.asyncio
async def test_process_expense_exact():
    db = MockSession()
    expense = Expense(id="e1", amount=10.0)
    payload = ExpenseCreate(description="Test", amount=10.0, paid_by="m1", split_type="exact", splits=[
        SplitInput(member_id="m1", value=4.0),
        SplitInput(member_id="m2", value=6.0)
    ])
    await process_expense_splits(db, "g1", expense, payload)
    
    assert len(db.added) == 2
    assert db.added[0].share_amount == 4.0
    assert db.added[1].share_amount == 6.0

@pytest.mark.asyncio
async def test_process_expense_exact_validation():
    db = MockSession()
    expense = Expense(id="e1", amount=10.0)
    payload = ExpenseCreate(description="Test", amount=10.0, paid_by="m1", split_type="exact", splits=[
        SplitInput(member_id="m1", value=4.0),
        SplitInput(member_id="m2", value=5.0) # Adds up to 9, not 10
    ])
    with pytest.raises(HTTPException):
        await process_expense_splits(db, "g1", expense, payload)
