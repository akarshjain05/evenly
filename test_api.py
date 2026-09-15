import asyncio
from sqlalchemy.orm import Session
from app import models, schemas
from app.main import app
from app.database import SessionLocal
from fastapi.testclient import TestClient

client = TestClient(app)

def run():
    db = SessionLocal()
    # Create user
    user = models.User(email="test@test.com", password_hash="hash")
    db.add(user)
    db.commit()
    
    # Create group
    group = models.Group(name="Trip")
    db.add(group)
    db.commit()
    
    # Create member
    member = models.Member(group_id=group.id, user_id=user.id, name="AK", color="#111")
    db.add(member)
    db.commit()
    
    # Simulate POST
    payload = {
        "description": "Food",
        "amount": 10000,
        "paid_by": member.id,
        "split_type": "equal",
        "participant_ids": [member.id]
    }
    
    response = client.post(
        f"/api/groups/{group.id}/expenses", 
        json=payload,
        # Mock auth by faking Depends? Let's just create a token.
    )
    print("Response status:", response.status_code)
    print("Response body:", response.json() if response.status_code < 500 else response.text)

run()
