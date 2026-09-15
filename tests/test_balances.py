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
