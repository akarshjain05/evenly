import pytest

@pytest.mark.asyncio
async def test_expense_negative_amount(client, auth_user, populated_group):
    cookies = auth_user['cookies']
    headers = auth_user.get('headers', {})
    group_id = populated_group['group_id']
    m1_id = populated_group['member1_id']
    
    res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Negative Expense",
        "amount": -50.0,
        "paid_by": m1_id,
        "split_type": "equal",
        "participant_ids": [m1_id]
    }, cookies=cookies, headers=headers)
    assert res.status_code == 422  # validation error

@pytest.mark.asyncio
async def test_expense_zero_amount(client, auth_user, populated_group):
    cookies = auth_user['cookies']
    headers = auth_user.get('headers', {})
    group_id = populated_group['group_id']
    m1_id = populated_group['member1_id']
    
    res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Zero Expense",
        "amount": 0.0,
        "paid_by": m1_id,
        "split_type": "equal",
        "participant_ids": [m1_id]
    }, cookies=cookies, headers=headers)
    assert res.status_code == 422

@pytest.mark.asyncio
async def test_expense_overflow_amount(client, auth_user, populated_group):
    cookies = auth_user['cookies']
    headers = auth_user.get('headers', {})
    group_id = populated_group['group_id']
    m1_id = populated_group['member1_id']
    
    res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Overflow Expense",
        "amount": 1e16,  # Way too large
        "paid_by": m1_id,
        "split_type": "equal",
        "participant_ids": [m1_id]
    }, cookies=cookies, headers=headers)
    assert res.status_code == 422
