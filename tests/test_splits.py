import pytest
from app import schemas

def test_exact_split_creation(client, populated_group):
    cookies = populated_group["user1"]["cookies"]
    group_id = populated_group["group_id"]
    m1 = populated_group["member1_id"]
    m2 = populated_group["member2_id"]
    
    # Valid exact split
    expense_data = {
        "description": "Dinner (Exact)",
        "amount": 100.0,
        "paid_by": m1,
        "category": "Food",
        "split_type": "exact",
        "splits": [
            {"member_id": m1, "value": 60.0},
            {"member_id": m2, "value": 40.0}
        ]
    }
    res = client.post(f"/api/groups/{group_id}/expenses", json=expense_data, cookies=cookies)
    assert res.status_code == 200
    
    # Check balances
    res2 = client.get(f"/api/groups/{group_id}", cookies=cookies)
    members = res2.json()["members"]
    alice = next(m for m in members if m["id"] == m1)
    bob = next(m for m in members if m["id"] == m2)
    
    # Alice paid 100, owes 60 -> net +40
    # Bob paid 0, owes 40 -> net -40
    assert alice["balance"] == "40.00"
    assert bob["balance"] == "-40.00"

def test_exact_split_validation_failure(client, populated_group):
    cookies = populated_group["user1"]["cookies"]
    group_id = populated_group["group_id"]
    m1 = populated_group["member1_id"]
    m2 = populated_group["member2_id"]
    
    # Invalid exact split (sum != amount)
    expense_data = {
        "description": "Dinner (Exact)",
        "amount": 100.0,
        "paid_by": m1,
        "category": "Food",
        "split_type": "exact",
        "splits": [
            {"member_id": m1, "value": 50.0},
            {"member_id": m2, "value": 40.0}
        ]
    }
    res = client.post(f"/api/groups/{group_id}/expenses", json=expense_data, cookies=cookies)
    assert res.status_code == 400
    assert "Splits add up to" in res.json()["detail"]
