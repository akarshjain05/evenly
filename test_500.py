import requests

# 1. Register a user
res = requests.post("https://evenly-eight.vercel.app/api/auth/register", json={
    "email": "test_500@test.com",
    "password": "password",
    "name": "Test User"
})

# 2. Login
session = requests.Session()
res = session.post("https://evenly-eight.vercel.app/api/auth/login", json={
    "email": "test_500@test.com",
    "password": "password"
})

# 3. Create Group
res = session.post("https://evenly-eight.vercel.app/api/groups", json={
    "name": "Test Group"
})
group_id = res.json()["group"]["id"]

# 4. Get Group Members
res = session.get(f"https://evenly-eight.vercel.app/api/groups/{group_id}")
member_id = res.json()["members"][0]["id"]

# 5. Add Expense
res = session.post(f"https://evenly-eight.vercel.app/api/groups/{group_id}/expenses", json={
    "description": "Dinner",
    "amount": 1000,
    "paid_by": member_id,
    "split_type": "equal"
})
print(res.status_code)
print(res.headers)
print(res.text)
