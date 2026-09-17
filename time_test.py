import requests
import time

session = requests.Session()
# 1. Login
session.post("https://evenly-eight.vercel.app/api/auth/login", json={
    "email": "test2@test.com",
    "password": "password"
})

# 2. Get group
res = session.get("https://evenly-eight.vercel.app/api/groups/33648993b1bc4412a5dddd7ba70baf29")
member_id = res.json()["members"][0]["id"]

# 3. Add Expense
start = time.time()
res = session.post("https://evenly-eight.vercel.app/api/groups/33648993b1bc4412a5dddd7ba70baf29/expenses", json={
    "description": "Dinner",
    "amount": 1000,
    "paid_by": member_id,
    "split_type": "equal"
})
end = time.time()
print(f"Status: {res.status_code}")
print(f"Time taken: {end - start:.2f} seconds")
