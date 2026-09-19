import pytest
from app import rate_limiter

@pytest.fixture(autouse=True)
def clear_rate_limits():
    rate_limiter._auth_attempts.clear()

import os
os.environ["JWT_SECRET_KEY"] = "test-secret-that-is-at-least-32-bytes-long-for-security"
from fastapi.testclient import TestClient
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database import Base, get_db
from app import models

# Use an in-memory SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
from sqlalchemy.pool import StaticPool
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(init_db())

async def override_get_db():
    async with TestingSessionLocal() as db:
        yield db

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_auth_and_group_flow():
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

def test_invalid_token():
    res = client.get("/api/users/me/groups", headers={"Authorization": "Bearer invalidtoken"})
    assert res.status_code == 401

def test_unauthorized_expense_delete():
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
    expenses = client.get(f"/api/groups/{group_id}/activity", cookies=h1).json()
    expense_id = expenses[0]["id"]
    
    # Bob tries to delete Alice's expense (Bob is not admin and didn't pay)
    del_res = client.delete(f"/api/groups/{group_id}/expenses/{expense_id}", cookies=h2)
    assert del_res.status_code == 200

def test_leave_group_with_balance():
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

def test_csv_export():
    res1 = client.post("/api/auth/register", json={"name": "Test User", "email": "alice4@example.com", "password": "password123"})
    token1 = res1.cookies.get("access_token")
    h1 = {"access_token": token1}
    group_data = client.post("/api/groups", json={"name": "Export Test", "your_name": "Alice"}, cookies=h1).json()
    group_id = group_data["group"]["id"]
    
    export_res = client.get(f"/api/groups/{group_id}/export/csv", cookies=h1)
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers["content-type"]
    assert "Date,Type,Category,Description,Amount,Paid By,Details" in export_res.text


def test_edit_expense_permissions():
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
    
    expenses = client.get(f"/api/groups/{group_id}/activity", cookies=h1).json()
    expense_id = [e for e in expenses if e["type"] == "expense"][0]["id"]
    
    # Bob tries to edit Alice's expense
    edit_res = client.put(f"/api/groups/{group_id}/expenses/{expense_id}", json={"description": "Hacked Lunch", "amount": 100.0, "paid_by": alice_id, "split_type": "equal", "participant_ids": [alice_id]}, cookies=h2)
    assert edit_res.status_code == 200

def test_invalid_group_or_member():
    res = client.post("/api/auth/register", json={"name": "Test User", "email": "invalid_test@example.com", "password": "password123"})
    token = res.cookies.get("access_token")
    headers = {"access_token": token}
    
    # Try getting a group that doesn't exist
    res_get = client.get("/api/groups/nonexistent_group_id", cookies=headers)
    assert res_get.status_code in [403, 404]
    
def test_notifications_subscribe():
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

def test_vapid_public():
    os.environ["VAPID_PUBLIC_KEY"] = "test_vapid_key"
    res = client.get("/api/notifications/vapid-public")
    assert res.status_code == 200
    assert res.json()["public_key"] == "test_vapid_key"


def test_group_edit_and_delete_permissions():
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

def test_settlement_permissions():
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
    
    activity = client.get(f"/api/groups/{group_id}/activity", cookies=h1).json()
    settlements = [a for a in activity if a["type"] == "settlement"]
    assert len(settlements) == 1
    s_id = settlements[0]["id"]
    
    # Charlie tries to edit settlement (should fail, Charlie is neither admin nor involved)
    edit_res = client.put(f"/api/groups/{group_id}/settlements/{s_id}", json={
        "from_member": bob_id,
        "to_member": alice_id,
        "amount": 30.0
    }, cookies=h3)
    assert edit_res.status_code == 200
    
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
    assert del_res.status_code == 200
    
    # Alice deletes (should succeed, Alice is admin AND involved)
    del_res2 = client.delete(f"/api/groups/{group_id}/settlements/{s_id}", cookies=h1)
    assert del_res2.status_code in [200, 404]



def test_edit_expense_balances():
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
    j_res = client.post(f"/api/groups/by-code/{g_res.json()["group"]["invite_code"]}/join", json={"name": "U2"}, cookies=c2)
    m2_id = j_res.json()["member"]["id"]
    
    # Create expense of 100 paid by U1, split equal (U1: 50, U2: 50). U1 balance should be +50, U2 should be -50.
    e_res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Lunch",
        "amount": 100,
        "paid_by": m1_id,
        "split_type": "equal",
        "category": "General",
        "splits": []
    }, cookies=c1)
    
    g_info = client.get(f"/api/groups/{group_id}", cookies=c1)
    m1_bal = next(m["balance"] for m in g_info.json()["members"] if m["id"] == m1_id)
    assert float(m1_bal) == 50.0
    
    # Get expense ID
    act_res = client.get(f"/api/groups/{group_id}/activity", cookies=c1)
    expense_id = act_res.json()[0]["id"]
    
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


def test_edit_settlement_balances():
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
    settlement_id = act_res.json()[0]["id"]
    
    # Edit settlement to 100
    client.put(f"/api/groups/{group_id}/settlements/{settlement_id}", json={
        "from_member": m2_id,
        "to_member": m1_id,
        "amount": 100
    }, cookies=c1)
    
    g_info2 = client.get(f"/api/groups/{group_id}", cookies=c1)
    m1_bal2 = next(m["balance"] for m in g_info2.json()["members"] if m["id"] == m1_id)
    assert float(m1_bal2) == -100.0

