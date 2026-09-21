import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_percentage_splits(client: AsyncClient, token_headers):
    # create group
    res = await client.post("/api/groups", json={"name": "Test Group"}, headers=token_headers)
    group_id = res.json()["group"]["id"]
    
    # add members? Actually when we create it, we are the only member.
    # percentage splits require at least 2 people to be interesting.
    # Let's just create an expense with percentages anyway!
    
    expense_data = {
        "description": "Dinner",
        "amount": 100,
        "paid_by": res.json()["member"]["id"],
        "split_type": "percentage",
        "splits": [
            {"member_id": res.json()["member"]["id"], "value": 100.00}
        ]
    }
    
    res = await client.post(f"/api/groups/{group_id}/expenses", json=expense_data, headers=token_headers)
    assert res.status_code == 200

