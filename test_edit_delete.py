import requests, time

session = requests.Session()
session.post("https://evenly-eight.vercel.app/api/auth/login", json={"email": "test2@test.com", "password": "password"})

# Create group
g = session.post("https://evenly-eight.vercel.app/api/groups", json={"name": "Edit Test Group"}).json()
group_id = g["group"]["id"]
member_id = g["member"]["id"]
print(f"Group: {group_id}")

# Add expense
e = session.post(f"https://evenly-eight.vercel.app/api/groups/{group_id}/expenses", json={
    "description": "Original", "amount": 100, "paid_by": member_id, "split_type": "equal"
})
print(f"Add: {e.status_code}")
time.sleep(2)

# Get activity to find expense id
acts = session.get(f"https://evenly-eight.vercel.app/api/groups/{group_id}/activity").json()
expense_id = acts[0]["id"]
print(f"Expense id: {expense_id}")

# Edit expense
edit = session.put(f"https://evenly-eight.vercel.app/api/groups/{group_id}/expenses/{expense_id}", json={
    "description": "Edited Name", "amount": 250, "paid_by": member_id, "split_type": "equal", "category": "General"
})
print(f"Edit: {edit.status_code} {edit.json()}")

# Verify edit
acts2 = session.get(f"https://evenly-eight.vercel.app/api/groups/{group_id}/activity").json()
print(f"After edit: {acts2[0]['description']} ₹{acts2[0]['amount']}")

# Delete expense
d = session.delete(f"https://evenly-eight.vercel.app/api/groups/{group_id}/expenses/{expense_id}")
print(f"Delete: {d.status_code} {d.json()}")

# Verify delete
acts3 = session.get(f"https://evenly-eight.vercel.app/api/groups/{group_id}/activity").json()
print(f"After delete: {len(acts3)} expenses remaining")
