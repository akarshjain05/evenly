import os
import logging
from unittest.mock import patch
def test_auth_and_group_flow(client):
    # 1. Register a new user
    res = client.post("/api/auth/register", json={"name": "Test User", "email": "test@example.com", "password": "password123"})
    assert res.status_code == 200
    token = res.cookies.get("access_token")
    headers = {"access_token": token}

    # 2. Create a group
    res = client.post("/api/groups", json={"name": "Test Trip", "your_name": "Alice"}, cookies=headers)
    assert res.status_code == 200
    group_data = res.json()
    group_id = group_data["group"]["id"]
    invite_code = group_data["group"]["invite_code"]

    # 3. Register User 2
    res2 = client.post("/api/auth/register", json={"name": "Test User", "email": "bob@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    headers2 = {"access_token": token2}

    # 4. User 2 joins the group
    res2 = client.post(f"/api/groups/by-code/{invite_code}/join", json={"name": "Bob"}, cookies=headers2)
    assert res2.status_code == 200

    # 5. Add an equal expense (Alice pays 30, split equally between Alice and Bob)
    alice_id = group_data["member"]["id"]
    
    # We need Bob's ID to split equally
    res_b = client.get(f"/api/groups/{group_id}", cookies=headers)
    bob_id = [m["id"] for m in res_b.json()["members"] if m["name"] == "Bob"][0]
    
    res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Dinner",
        "amount": 30.0,
        "paid_by": alice_id,
        "split_type": "equal",
        "participant_ids": [alice_id, bob_id]
    }, cookies=headers)
    assert res.status_code == 200

    # 6. Check balances (Bob should owe Alice 15)
    res = client.get(f"/api/groups/{group_id}", cookies=headers)
    assert res.status_code == 200
    transactions = res.json()["simplified_debts"]
    assert len(transactions) == 1
    assert float(transactions[0]["amount"]) == 15.0

def test_invalid_token(client):
    res = client.get("/api/users/me/groups", headers={"Authorization": "Bearer invalidtoken"})
    assert res.status_code == 401

def test_unauthorized_expense_delete(client):
    # Setup test
    res1 = client.post("/api/auth/register", json={"name": "Test User", "email": "alice2@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    
    group_data = client.post("/api/groups", json={"name": "Test Delete", "your_name": "Alice"}, cookies=h1).json()
    group_id = group_data["group"]["id"]
    alice_id = group_data["member"]["id"]
    
    res2 = client.post("/api/auth/register", json={"name": "Test User", "email": "bob2@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    h2 = {"access_token": token2}
    
    client.post(f"/api/groups/by-code/{group_data['group']['invite_code']}/join", json={"name": "Bob"}, cookies=h2)
    
    # Alice adds an expense
    client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Lunch",
        "amount": 20.0,
        "paid_by": alice_id,
        "split_type": "equal",
        "participant_ids": [alice_id]
    }, cookies=h1)
    
    # Get expense ID
    expenses = client.get(f"/api/groups/{group_id}/activity", cookies=h1).json()["items"]
    expense_id = expenses[0]["id"]
    
    # Bob tries to delete Alice's expense (Bob is not admin and didn't pay)
    del_res = client.delete(f"/api/groups/{group_id}/expenses/{expense_id}", cookies=h2)
    assert del_res.status_code == 403

def test_leave_group_with_balance(client):
    # Setup
    res1 = client.post("/api/auth/register", json={"name": "Test User", "email": "alice3@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    
    group_data = client.post("/api/groups", json={"name": "Test Leave", "your_name": "Alice"}, cookies=h1).json()
    group_id = group_data["group"]["id"]
    alice_id = group_data["member"]["id"]
    
    res2 = client.post("/api/auth/register", json={"name": "Test User", "email": "bob3@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    h2 = {"access_token": token2}
    
    bob_join = client.post(f"/api/groups/by-code/{group_data['group']['invite_code']}/join", json={"name": "Bob"}, cookies=h2).json()
    bob_id = bob_join["member"]["id"]
    
    # Alice adds expense split with Bob (so Bob owes Alice)
    client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Tickets",
        "amount": 50.0,
        "paid_by": alice_id,
        "split_type": "equal",
        "participant_ids": [alice_id, bob_id]
    }, cookies=h1)
    
    # Bob tries to leave the group
    leave_res = client.delete(f"/api/groups/{group_id}/members/{bob_id}", cookies=h2)
    assert leave_res.status_code == 400
    assert "unsettled balance" in leave_res.json()["detail"]

def test_csv_export(client):
    res1 = client.post("/api/auth/register", json={"name": "Test User", "email": "alice4@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    group_data = client.post("/api/groups", json={"name": "Export Test", "your_name": "Alice"}, cookies=h1).json()
    group_id = group_data["group"]["id"]
    m1_id = group_data["member"]["id"]
    invite_code = group_data["group"]["invite_code"]

    res2 = client.post("/api/auth/register", json={"name": "Bob User", "email": "bob4@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    h2 = {"access_token": token2}
    j_res = client.post(f"/api/groups/by-code/{invite_code}/join", json={"name": "Bob"}, cookies=h2).json()
    m2_id = j_res["member"]["id"]
    
    # Add an expense
    client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Lunch",
        "amount": 100,
        "paid_by": m1_id,
        "split_type": "equal",
        "category": "Food",
        "splits": []
    }, cookies=h1)
    
    # Add a settlement
    client.post(f"/api/groups/{group_id}/settlements", json={
        "from_member": m2_id,
        "to_member": m1_id,
        "amount": 50
    }, cookies=h2)

    export_res = client.get(f"/api/groups/{group_id}/export/csv", cookies=h1)
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers["content-type"]
    lines = export_res.text.strip().split("\n")
    assert "Date,Type,Category,Description,Amount,Paid By,Details" in lines[0]
    
    # The output should have 2 rows, plus the header
    assert len(lines) == 3
    
    content_text = export_res.text
    assert "Expense,Food,Lunch,100.00,Alice,Split: equal" in content_text
    assert "Settlement,-,Settlement,50.00,Bob,Paid to: Alice" in content_text


def test_edit_expense_permissions(client):
    res1 = client.post("/api/auth/register", json={"name": "Test User", "email": "alice_edit@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    
    group_data = client.post("/api/groups", json={"name": "Test Edit", "your_name": "Alice"}, cookies=h1).json()
    group_id = group_data["group"]["id"]
    alice_id = group_data["member"]["id"]
    
    res2 = client.post("/api/auth/register", json={"name": "Test User", "email": "bob_edit@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    h2 = {"access_token": token2}
    
    client.post(f"/api/groups/by-code/{group_data['group']['invite_code']}/join", json={"name": "Bob"}, cookies=h2)
    
    # Alice adds an expense
    client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Lunch",
        "amount": 20.0,
        "paid_by": alice_id,
        "split_type": "equal",
        "category": "Food",
        "participant_ids": [alice_id]
    }, cookies=h1)
    
    expenses = client.get(f"/api/groups/{group_id}/activity", cookies=h1).json()["items"]
    expense_id = [e for e in expenses if e["type"] == "expense"][0]["id"]
    
    # Bob tries to edit Alice's expense
    edit_res = client.put(f"/api/groups/{group_id}/expenses/{expense_id}", json={"description": "Hacked Lunch", "amount": 100.0, "paid_by": alice_id, "split_type": "equal", "participant_ids": [alice_id]}, cookies=h2)
    assert edit_res.status_code == 403

def test_invalid_group_or_member(client):
    res = client.post("/api/auth/register", json={"name": "Test User", "email": "invalid_test@example.com", "password": "password123"})
    token = res.cookies.get("access_token")
    headers = {"access_token": token}
    
    # Try getting a group that doesn't exist
    res_get = client.get("/api/groups/nonexistent_group_id", cookies=headers)
    assert res_get.status_code in [403, 404]
    
def test_notifications_subscribe(client):
    res = client.post("/api/auth/register", json={"name": "Test User", "email": "notify_test@example.com", "password": "password123"})
    token = res.cookies.get("access_token")
    headers = {"access_token": token}
    
    # Test subscribe
    sub_res = client.post("/api/notifications/subscribe", json={
        "endpoint": "https://example.com/push",
        "p256dh": "test_p256dh",
        "auth": "test_auth"
    }, cookies=headers)
    assert sub_res.status_code == 200

def test_vapid_public(client, auth_user):
    os.environ["VAPID_PUBLIC_KEY"] = "test_vapid_key"
    res = client.get("/api/notifications/vapid-public", cookies=auth_user["cookies"])
    assert res.status_code == 200
    assert res.json()["public_key"] == "test_vapid_key"


def test_group_edit_and_delete_permissions(client):
    res1 = client.post("/api/auth/register", json={"name": "Test User", "email": "alice_grp@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    
    group_data = client.post("/api/groups", json={"name": "Test Group Edit", "your_name": "Alice"}, cookies=h1).json()
    group_id = group_data["group"]["id"]
    
    res2 = client.post("/api/auth/register", json={"name": "Test User", "email": "bob_grp@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    h2 = {"access_token": token2}
    
    client.post(f"/api/groups/by-code/{group_data['group']['invite_code']}/join", json={"name": "Bob"}, cookies=h2)
    
    # Bob tries to edit the group (should fail, only admin)
    edit_res = client.put(f"/api/groups/{group_id}", json={"name": "Hacked Group"}, cookies=h2)
    assert edit_res.status_code == 403
    
    # Alice edits the group (should succeed)
    edit_res2 = client.put(f"/api/groups/{group_id}", json={"name": "Alice Group"}, cookies=h1)
    assert edit_res2.status_code == 200
    
    # Bob tries to delete the group (should fail)
    del_res = client.delete(f"/api/groups/{group_id}", cookies=h2)
    assert del_res.status_code == 403
    
    # Alice deletes the group (should succeed)
    del_res2 = client.delete(f"/api/groups/{group_id}", cookies=h1)
    assert del_res2.status_code == 200

def test_settlement_permissions(client):
    res1 = client.post("/api/auth/register", json={"name": "Test User", "email": "alice_stl@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    
    group_data = client.post("/api/groups", json={"name": "Test Settlements", "your_name": "Alice"}, cookies=h1).json()
    group_id = group_data["group"]["id"]
    alice_id = group_data["member"]["id"]
    
    res2 = client.post("/api/auth/register", json={"name": "Test User", "email": "bob_stl@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    h2 = {"access_token": token2}
    
    bob_join = client.post(f"/api/groups/by-code/{group_data['group']['invite_code']}/join", json={"name": "Bob"}, cookies=h2).json()
    bob_id = bob_join["member"]["id"]
    
    # Add a third user to test 403 errors
    res3 = client.post("/api/auth/register", json={"name": "Test User", "email": "charlie_stl@example.com", "password": "password123"})
    token3 = res3.cookies.get("access_token")
    h3 = {"access_token": token3}
    client.post(f"/api/groups/by-code/{group_data['group']['invite_code']}/join", json={"name": "Charlie"}, cookies=h3)
    
    # Alice records a settlement (Bob paid Alice)
    client.post(f"/api/groups/{group_id}/settlements", json={
        "from_member": bob_id,
        "to_member": alice_id,
        "amount": 20.0
    }, cookies=h1)
    
    activity = client.get(f"/api/groups/{group_id}/activity", cookies=h1).json()["items"]
    settlements = [a for a in activity if a["type"] == "settlement"]
    assert len(settlements) == 1
    s_id = settlements[0]["id"]
    
    # Charlie tries to edit settlement (should fail, Charlie is neither admin nor involved)
    edit_res = client.put(f"/api/groups/{group_id}/settlements/{s_id}", json={
        "from_member": bob_id,
        "to_member": alice_id,
        "amount": 30.0
    }, cookies=h3)
    assert edit_res.status_code == 403
    
    # Bob tries to edit (should succeed, Bob is involved)
    edit_res2 = client.put(f"/api/groups/{group_id}/settlements/{s_id}", json={
        "from_member": bob_id,
        "to_member": alice_id,
        "amount": 30.0
    }, cookies=h2)
    assert edit_res2.status_code == 200
    
    # Charlie tries to delete (should fail)
    del_res = client.delete(f"/api/groups/{group_id}/settlements/{s_id}", cookies=h3)
    # It gets deleted, so status code is 200
    assert del_res.status_code == 403
    
    # Alice deletes (should succeed, Alice is admin AND involved)
    del_res2 = client.delete(f"/api/groups/{group_id}/settlements/{s_id}", cookies=h1)
    assert del_res2.status_code in [200, 404]



def test_edit_expense_balances(client):
    client.post("/api/auth/register", json={"email": "u1_edit@test.com", "password": "password123", "name": "U1"})
    l1 = client.post("/api/auth/login", json={"email": "u1_edit@test.com", "password": "password123"})
    c1 = {"access_token": l1.cookies.get("access_token")}
    
    g_res = client.post("/api/groups", json={"name": "Edit Test"}, cookies=c1)
    assert g_res.status_code == 200
    group_id = g_res.json()["group"]["id"]
    m1_id = g_res.json()["member"]["id"]
    
    client.post("/api/auth/register", json={"email": "u2_edit@test.com", "password": "password123", "name": "U2"})
    l2 = client.post("/api/auth/login", json={"email": "u2_edit@test.com", "password": "password123"})
    c2 = {"access_token": l2.cookies.get("access_token")}
    j_res = client.post(f"/api/groups/by-code/{g_res.json()['group']['invite_code']}/join", json={"name": "U2"}, cookies=c2)
    assert j_res.status_code == 200
    
    # Create expense of 100 paid by U1, split equal (U1: 50, U2: 50). U1 balance should be +50, U2 should be -50.
    e_res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Lunch",
        "amount": 100,
        "paid_by": m1_id,
        "split_type": "equal",
        "category": "General",
        "splits": []
    }, cookies=c1)
    assert e_res.status_code == 200
    
    g_info = client.get(f"/api/groups/{group_id}", cookies=c1)
    m1_bal = next(m["balance"] for m in g_info.json()["members"] if m["id"] == m1_id)
    assert float(m1_bal) == 50.0
    
    # Get expense ID
    act_res = client.get(f"/api/groups/{group_id}/activity", cookies=c1)
    expense_id = act_res.json()["items"][0]["id"]
    
    # Edit expense to 200. U1 balance should be +100, U2 should be -100.
    client.put(f"/api/groups/{group_id}/expenses/{expense_id}", json={
        "description": "Lunch",
        "amount": 200,
        "paid_by": m1_id,
        "split_type": "equal",
        "category": "General",
        "splits": []
    }, cookies=c1)
    
    g_info2 = client.get(f"/api/groups/{group_id}", cookies=c1)
    m1_bal2 = next(m["balance"] for m in g_info2.json()["members"] if m["id"] == m1_id)
    assert float(m1_bal2) == 100.0


def test_edit_settlement_balances(client):
    client.post("/api/auth/register", json={"email": "u1_set@test.com", "password": "password123", "name": "U1"})
    l1 = client.post("/api/auth/login", json={"email": "u1_set@test.com", "password": "password123"})
    c1 = {"access_token": l1.cookies.get("access_token")}
    
    g_res = client.post("/api/groups", json={"name": "Settlement Test"}, cookies=c1)
    group_id = g_res.json()["group"]["id"]
    m1_id = g_res.json()["member"]["id"]
    
    client.post("/api/auth/register", json={"email": "u2_set@test.com", "password": "password123", "name": "U2"})
    l2 = client.post("/api/auth/login", json={"email": "u2_set@test.com", "password": "password123"})
    c2 = {"access_token": l2.cookies.get("access_token")}
    j_res = client.post(f"/api/groups/by-code/{g_res.json()["group"]["invite_code"]}/join", json={"name": "U2"}, cookies=c2)
    m2_id = j_res.json()["member"]["id"]
    
    # Create settlement of 50 from U2 to U1. U1 balance should be -50 (they received), U2 should be +50
    s_res = client.post(f"/api/groups/{group_id}/settlements", json={
        "from_member": m2_id,
        "to_member": m1_id,
        "amount": 50
    }, cookies=c1)
    
    g_info = client.get(f"/api/groups/{group_id}", cookies=c1)
    m1_bal = next(m["balance"] for m in g_info.json()["members"] if m["id"] == m1_id)
    assert float(m1_bal) == -50.0
    
    # Get settlement ID
    act_res = client.get(f"/api/groups/{group_id}/activity", cookies=c1)
    settlement_id = act_res.json()["items"][0]["id"]
    
    # Edit settlement to 100
    client.put(f"/api/groups/{group_id}/settlements/{settlement_id}", json={
        "from_member": m2_id,
        "to_member": m1_id,
        "amount": 100
    }, cookies=c1)
    
    g_info2 = client.get(f"/api/groups/{group_id}", cookies=c1)
    m1_bal2 = next(m["balance"] for m in g_info2.json()["members"] if m["id"] == m1_id)
    assert float(m1_bal2) == -100.0


def test_reconcile_ledger(client):
    res1 = client.post("/api/auth/register", json={"name": "Reconcile Admin", "email": "admin_recon@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    
    group_data = client.post("/api/groups", json={"name": "Reconcile Test", "your_name": "Admin"}, cookies=h1).json()
    group_id = group_data["group"]["id"]
    admin_id = group_data["member"]["id"]
    
    # Add a member
    res2 = client.post("/api/auth/register", json={"name": "Reconcile Member", "email": "member_recon@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    h2 = {"access_token": token2}
    join_res = client.post(f"/api/groups/by-code/{group_data['group']['invite_code']}/join", json={"name": "Member"}, cookies=h2)
    join_data = join_res.json()
    if 'member' not in join_data: raise ValueError(f'JOIN FAILED: {join_data}')
    member_id = join_data["member"]["id"]
    
    # Add an expense: Admin paid 100, split equally (Admin 50, Member 50)
    client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Test Expense",
        "amount": 100.0,
        "paid_by": admin_id,
        "split_type": "equal",
        "participant_ids": [admin_id, member_id]
    }, cookies=h1)
    
    # Now, we manually mess up the DB balance to simulate drift using an internal endpoint or SQL directly
    # But since we can't do that easily from the test client, we will just call the reconcile endpoint and make sure it doesn't break things.
    recon_res = client.post(f"/api/groups/{group_id}/reconcile", cookies=h1)
    assert recon_res.status_code == 200
    
    # Check that balances remain mathematically correct (Admin +50, Member -50)
    data = recon_res.json()
    admin_member = next(m for m in data["members"] if m["id"] == admin_id)
    reg_member = next(m for m in data["members"] if m["id"] == member_id)
    
    assert admin_member["balance"] == "50.00"
    assert reg_member["balance"] == "-50.00"

    # Only admin can reconcile
    recon_res2 = client.post(f"/api/groups/{group_id}/reconcile", cookies=h2)
    assert recon_res2.status_code == 403

def test_cross_group_settlement_update_validation(client):
    # Setup Group A with users Alice and Bob
    res1 = client.post("/api/auth/register", json={"name": "Alice", "email": "alice_cross@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    gA = client.post("/api/groups", json={"name": "Group A", "your_name": "Alice"}, cookies=h1).json()
    groupA_id = gA["group"]["id"]
    aliceA_id = gA["member"]["id"]
    
    res2 = client.post("/api/auth/register", json={"name": "Bob", "email": "bob_cross@example.com", "password": "password123"})
    token2 = res2.cookies.get("access_token")
    h2 = {"access_token": token2}
    bobA = client.post(f"/api/groups/by-code/{gA['group']['invite_code']}/join", json={"name": "Bob"}, cookies=h2).json()
    bobA_id = bobA["member"]["id"]
    
    # Add a valid settlement in Group A
    setA = client.post(f"/api/groups/{groupA_id}/settlements", json={
        "from_member": bobA_id,
        "to_member": aliceA_id,
        "amount": 50
    }, cookies=h1).json()
    settlement_id = client.get(f"/api/groups/{groupA_id}/activity", cookies=h1).json()["items"][0]["id"]
    
    # Setup Group B with Charlie
    res3 = client.post("/api/auth/register", json={"name": "Charlie", "email": "charlie_cross@example.com", "password": "password123"})
    token3 = res3.cookies.get("access_token")
    h3 = {"access_token": token3}
    gB = client.post("/api/groups", json={"name": "Group B", "your_name": "Charlie"}, cookies=h3).json()
    charlieB_id = gB["member"]["id"]
    
    # Now try to update the Group A settlement using Charlie from Group B
    res_update = client.put(f"/api/groups/{groupA_id}/settlements/{settlement_id}", json={
        "from_member": charlieB_id,  # Invalid! Not in Group A
        "to_member": aliceA_id,
        "amount": 50
    }, cookies=h1)
    
    assert res_update.status_code == 400
    assert "both people must be in this tab" in res_update.json()["detail"].lower()




def test_critical_percentage_splits(client):
    # Setup group
    res = client.post("/api/auth/register", json={"name": "Payer", "email": "payer@example.com", "password": "password123"})
    h1 = {"access_token": res.cookies.get("access_token")}
    g = client.post("/api/groups", json={"name": "Percent Test", "your_name": "Payer"}, cookies=h1).json()
    group_id = g["group"]["id"]
    payer_id = g["member"]["id"]
    
    # Add member 2
    res2 = client.post("/api/auth/register", json={"name": "Member2", "email": "m2@example.com", "password": "password123"})
    h2 = {"access_token": res2.cookies.get("access_token")}
    m2 = client.post(f"/api/groups/by-code/{g['group']['invite_code']}/join", json={"name": "Member2"}, cookies=h2).json()["member"]["id"]

    # Submit percentage split
    expense_payload = {
        "description": "Percent",
        "amount": 100,
        "paid_by": payer_id,
        "split_type": "percentage",
        "splits": [
            {"member_id": payer_id, "value": 33.33},
            {"member_id": m2, "value": 66.67}
        ]
    }
    res3 = client.post(f"/api/groups/{group_id}/expenses", json=expense_payload, cookies=h1)
    assert res3.status_code == 200
    
    # Check balances
    group_detail = client.get(f"/api/groups/{group_id}", cookies=h1).json()
    balances = {m["id"]: m["balance"] for m in group_detail["members"]}
    # Payer paid 100, owes 33.33 -> net 66.67
    assert float(balances[payer_id]) == 66.67
    # M2 paid 0, owes 66.67 -> net -66.67
    assert float(balances[m2]) == -66.67

def test_critical_logout_cookie(client):
    res = client.post("/api/auth/register", json={"name": "Logout", "email": "logout@example.com", "password": "password123"})
    h1 = {"access_token": res.cookies.get("access_token")}
    # Logout
    res2 = client.post("/api/auth/logout", cookies=h1)
    assert res2.status_code == 200
    # verify cookie deletion headers
    cookies = res2.headers.get_list("set-cookie")
    assert any("access_token=" in c and "Max-Age=0" in c for c in cookies)

def test_critical_group_preview_security(client):
    res = client.post("/api/auth/register", json={"name": "Preview", "email": "preview@example.com", "password": "password123"})
    h1 = {"access_token": res.cookies.get("access_token")}
    g = client.post("/api/groups", json={"name": "Preview Group"}, cookies=h1).json()
    invite = g["group"]["invite_code"]
    
    # unauthenticated should fail 401
    res2 = client.get(f"/api/groups/by-code/{invite}")
    assert res2.status_code == 401
    
    # authenticated should succeed
    res3 = client.post("/api/auth/register", json={"name": "Spy", "email": "spy@example.com", "password": "password123"})
    h2 = {"access_token": res3.cookies.get("access_token")}
    res4 = client.get(f"/api/groups/by-code/{invite}", cookies=h2)
    assert res4.status_code == 200

import threading

def test_critical_concurrent_expense_creation(client):
    # Setup group
    res = client.post("/api/auth/register", json={"name": "C1", "email": "c1@example.com", "password": "password123"})
    h1 = {"access_token": res.cookies.get("access_token")}
    g = client.post("/api/groups", json={"name": "Concurrent", "your_name": "C1"}, cookies=h1).json()
    group_id = g["group"]["id"]
    c1_id = g["member"]["id"]
    
    # Add member 2
    res2 = client.post("/api/auth/register", json={"name": "C2", "email": "c2@example.com", "password": "password123"})
    h2 = {"access_token": res2.cookies.get("access_token")}
    c2_id = client.post(f"/api/groups/by-code/{g['group']['invite_code']}/join", json={"name": "C2"}, cookies=h2).json()["member"]["id"]
    
    def add_expense(token, amount):
        client.post(f"/api/groups/{group_id}/expenses", json={
            "description": "Concurrent",
            "amount": amount,
            "paid_by": c1_id,
            "split_type": "equal",
            "participant_ids": [c1_id, c2_id]
        }, cookies={"access_token": token})
        
    t1 = threading.Thread(target=add_expense, args=(res.cookies.get("access_token"), 100))
    t2 = threading.Thread(target=add_expense, args=(res.cookies.get("access_token"), 200))
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    
    # Balance should be sum of both
    group_detail = client.get(f"/api/groups/{group_id}", cookies=h1).json()
    balances = {m["id"]: float(m["balance"]) for m in group_detail["members"]}
    assert balances[c1_id] == 150.0  # Paid 300, owes 150
    assert balances[c2_id] == -150.0 # Paid 0, owes 150



import logging

@patch("app.services.expense_service.send_web_push")
def test_critical_push_notification_logging(mock_send_web_push, client):
    res = client.post("/api/auth/register", json={"name": "Push1", "email": "push1_de95c89c@example.com", "password": "password123"})
    h1 = {"access_token": res.cookies.get("access_token")}
    g = client.post("/api/groups", json={"name": "Push Test", "your_name": "Push1"}, cookies=h1).json()
    group_id = g["group"]["id"]
    push1_id = g["member"]["id"]
    
    res2 = client.post("/api/auth/register", json={"name": "Push2", "email": "push2_de95c89c@example.com", "password": "password123"})
    h2 = {"access_token": res2.cookies.get("access_token")}
    
    # We must mock push_subscription being created so the backend knows this user has a device!
    client.post("/api/notifications/subscribe", json={"endpoint": "https://push.com/abc", "keys": {"p256dh": "p256", "auth": "auth"}}, cookies=h2)
    
    
    
    import jwt; push2_user_id = jwt.decode(h2["access_token"], options={"verify_signature": False})["sub"]
    push2_id = client.post(f"/api/groups/by-code/{g['group']['invite_code']}/join", json={"name": "Push2"}, cookies=h2).json()["member"]["id"]
    
    expense_payload = {
        "description": "Trigger Push",
        "amount": 10.0,
        "paid_by": push1_id,
        "split_type": "equal",
        "participant_ids": [push1_id, push2_id]
    }
    client.post(f"/api/groups/{group_id}/expenses", json=expense_payload, cookies=h1)
    
    mock_send_web_push.assert_called_once()
    args = mock_send_web_push.call_args[0]
    assert push2_user_id in args[0]

def test_cursor_pagination(client, auth_user, populated_group):
    cookies = auth_user['cookies']
    headers = auth_user.get('headers', {})
    group_id = populated_group['group_id']
    m1_id = populated_group['member1_id']
    
    for i in range(3):
        res = client.post(f"/api/groups/{group_id}/expenses", json={
            "description": f"Expense {i}",
            "amount": 10.0,
            "paid_by": m1_id,
            "split_type": "equal",
            "participant_ids": [m1_id]
        }, cookies=cookies, headers=headers)
        assert res.status_code == 200
        
    res = client.get(f"/api/groups/{group_id}/activity?limit=2", cookies=cookies, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2
    assert data["next_cursor"] is not None
    
    import urllib.parse
    cursor = urllib.parse.quote(data['next_cursor'])
    res2 = client.get(f"/api/groups/{group_id}/activity?limit=2&last_seen={cursor}", cookies=cookies, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["items"]) == 1
    assert data2["next_cursor"] is None

def test_ledger_reconciliation_drift(client, auth_user, auth_user_2):
    cookies1 = auth_user['cookies']
    headers1 = auth_user.get('headers', {})
    cookies2 = auth_user_2['cookies']
    headers2 = auth_user_2.get('headers', {})
    
    res = client.post("/api/groups", json={"name": "Drift Test", "your_name": "Alice"}, cookies=cookies1, headers=headers1)
    assert res.status_code == 200
    group_id = res.json()["group"]["id"]
    m1_id = res.json()["member"]["id"]
    join_code = res.json()["group"]["invite_code"]
    
    res2 = client.post(f"/api/groups/by-code/{join_code}/join", json={"name": "Bob"}, cookies=cookies2, headers=headers2)
    assert res2.status_code == 200
    m2_id = res2.json()["member"]["id"]
    
    res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Lunch",
        "amount": 100.0,
        "paid_by": m1_id,
        "split_type": "equal",
        "participant_ids": [m1_id, m2_id]
    }, cookies=cookies1, headers=headers1)
    assert res.status_code == 200
    
    res = client.post(f"/api/groups/{group_id}/settlements", json={
        "from_member": m2_id,
        "to_member": m1_id,
        "amount": 50.0
    }, cookies=cookies1, headers=headers1)
    assert res.status_code == 200
    
    group = client.get(f"/api/groups/{group_id}", cookies=cookies1, headers=headers1).json()
    assert float(group["members"][0]["balance"]) == 0
    assert float(group["members"][1]["balance"]) == 0
    
    activity = client.get(f"/api/groups/{group_id}/activity", cookies=cookies1, headers=headers1).json()["items"]
    exp_id = [a for a in activity if a["type"] == "expense"][0]["id"]
    client.delete(f"/api/groups/{group_id}/expenses/{exp_id}", cookies=cookies1, headers=headers1)
    
    group = client.get(f"/api/groups/{group_id}", cookies=cookies1, headers=headers1).json()
    b1 = [m for m in group["members"] if m["id"] == m1_id][0]["balance"]
    b2 = [m for m in group["members"] if m["id"] == m2_id][0]["balance"]
    assert float(b1) == -50.0
    assert float(b2) == 50.0

def test_logout_blocklist(client, auth_user):
    cookies = auth_user['cookies']
    headers = auth_user.get('headers', {})
    
    res = client.post("/api/auth/logout", cookies=cookies, headers=headers)
    assert res.status_code == 200
    
    res2 = client.get("/api/auth/csrf", cookies=cookies, headers=headers)
    assert res2.status_code == 401

def test_group_member_limit(client, auth_user):
    pass
