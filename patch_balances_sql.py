with open("app/balances.py", "r") as f:
    content = f.read()

replacement = """
    query = text('''
        UPDATE members
        SET balance = (
            COALESCE((SELECT SUM(amount) FROM expenses WHERE paid_by = members.id AND group_id = :group_id), 0)
            - COALESCE((SELECT SUM(share_amount) FROM expense_splits JOIN expenses ON expenses.id = expense_splits.expense_id WHERE expense_splits.member_id = members.id AND expenses.group_id = :group_id), 0)
            + COALESCE((SELECT SUM(amount) FROM settlements WHERE from_member = members.id AND group_id = :group_id), 0)
            - COALESCE((SELECT SUM(amount) FROM settlements WHERE to_member = members.id AND group_id = :group_id), 0)
        )
        WHERE group_id = :group_id
    ''')
    db.execute(query, {"group_id": group_id})
    db.flush()
    
    # DEBUG: print the raw sums to see why Alice is 0
    raw = db.execute(text('''
        SELECT id, name,
            COALESCE((SELECT SUM(amount) FROM expenses WHERE paid_by = members.id AND group_id = :group_id), 0) as paid,
            COALESCE((SELECT SUM(share_amount) FROM expense_splits JOIN expenses ON expenses.id = expense_splits.expense_id WHERE expense_splits.member_id = members.id AND expenses.group_id = :group_id), 0) as shared
        FROM members WHERE group_id = :group_id
    '''), {"group_id": group_id}).fetchall()
    print(f"RAW SUMS: {raw}")
"""
import re
content = re.sub(r'query = text\(\"\"\"[\s\S]*?db\.flush\(\)', replacement, content)
with open("app/balances.py", "w") as f:
    f.write(content)
