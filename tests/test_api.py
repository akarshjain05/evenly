import os
os.environ["JWT_SECRET_KEY"] = "test-secret-that-is-at-least-32-bytes-long-for-security"
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app import models

# Use an in-memory SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
from sqlalchemy.pool import StaticPool
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_auth_and_group_flow():
    # 1. Register a new user
    res = client.post("/api/auth/register", json={"email": "test@example.com", "password": "password123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a group
    res = client.post("/api/groups", json={"name": "Test Trip", "your_name": "Alice"}, headers=headers)
    assert res.status_code == 200
    group_data = res.json()
    group_id = group_data["group"]["id"]
    invite_code = group_data["group"]["invite_code"]

    # 3. Register User 2
    res2 = client.post("/api/auth/register", json={"email": "bob@example.com", "password": "password123"})
    token2 = res2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 4. User 2 joins the group
    res2 = client.post(f"/api/groups/by-code/{invite_code}/join", json={"name": "Bob"}, headers=headers2)
    assert res2.status_code == 200

    # 5. Add an equal expense (Alice pays 30, split equally between Alice and Bob)
    alice_id = group_data["member"]["id"]
    
    # We need Bob's ID to split equally
    res_b = client.get(f"/api/groups/{group_id}", headers=headers)
    bob_id = [m["id"] for m in res_b.json()["members"] if m["name"] == "Bob"][0]
    
    res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Dinner",
        "amount": 30.0,
        "paid_by": alice_id,
        "split_type": "equal",
        "participant_ids": [alice_id, bob_id]
    }, headers=headers)
    assert res.status_code == 200

    # 6. Check balances (Bob should owe Alice 15)
    res = client.get(f"/api/groups/{group_id}", headers=headers)
    assert res.status_code == 200
    transactions = res.json()["simplified_debts"]
    assert len(transactions) == 1
    assert float(transactions[0]["amount"]) == 15.0

def test_invalid_token():
    res = client.get("/api/users/me/groups", headers={"Authorization": "Bearer invalidtoken"})
    assert res.status_code == 401
