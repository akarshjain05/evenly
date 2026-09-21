import pytest

def test_percentage_splits(client, populated_group):
    cookies = populated_group["user1"]["cookies"]
    group_id = populated_group["group_id"]
    m1 = populated_group["member1_id"]
    m2 = populated_group["member2_id"]

    expense_data = {
        "description": "Dinner",
        "amount": 100,
        "paid_by": m1,
        "split_type": "percentage",
        "splits": [
            {"member_id": m1, "value": 60.00},
            {"member_id": m2, "value": 40.00}
        ]
    }

    res = client.post(f"/api/groups/{group_id}/expenses", json=expense_data, cookies=cookies)
    assert res.status_code == 200

