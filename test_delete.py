import requests
session = requests.Session()
# Login
session.post("https://evenly-eight.vercel.app/api/auth/login", json={"email": "test2@test.com", "password": "password"})
# Get group
res = session.get("https://evenly-eight.vercel.app/api/groups/33648993b1bc4412a5dddd7ba70baf29/activity")
expenses = res.json()
if not expenses:
    print("No expenses to delete")
else:
    expense_id = expenses[0]["id"]
    print(f"Deleting expense {expense_id}")
    del_res = session.delete(f"https://evenly-eight.vercel.app/api/groups/33648993b1bc4412a5dddd7ba70baf29/expenses/{expense_id}")
    print(del_res.status_code, del_res.text)
