import pytest
import concurrent.futures
from app import schemas

def test_critical_concurrent_settlement_creation(client, populated_group):
    headers = populated_group["user1"]["cookies"]
    group_id = populated_group["group_id"]
    m1 = populated_group["member1_id"]
    m2 = populated_group["member2_id"]
    
    # Give member 2 a 100 debt initially
    expense_data = {
        "description": "Initial Debt",
        "amount": 100.0,
        "paid_by": m1,
        "category": "General",
        "split_type": "equal",
        "participant_ids": [m1, m2]
    }
    client.post(f"/api/groups/{group_id}/expenses", json=expense_data, cookies=headers)
    
    # Concurrently send 5 settlements of 10.0
    settlement_data = {
        "from_member": m2,
        "to_member": m1,
        "amount": 10.0
    }
    
    def add_settle():
        # Each thread gets its own TestClient to avoid thread-local request dropping issues
        # Actually starlette TestClient handles concurrency okay, but passing the same headers works.
        return client.post(f"/api/groups/{group_id}/settlements", json=settlement_data, cookies=headers)
        
    num_concurrent = 5
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(add_settle) for _ in range(num_concurrent)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
    assert all(r.status_code == 200 for r in results)
    
    # Final balances should be 50.0 (Alice) and -50.0 (Bob)
    res = client.get(f"/api/groups/{group_id}", cookies=headers)
    members = res.json()["members"]
    alice = next(m for m in members if m["id"] == m1)
    bob = next(m for m in members if m["id"] == m2)
    
    # Initial debt: Alice +50, Bob -50
    # Paid 5 settlements of 10. Bob sent 50 to Alice.
    # New balance: Alice 0, Bob 0!
    assert alice["balance"] == "0.00"
    assert bob["balance"] == "0.00"
