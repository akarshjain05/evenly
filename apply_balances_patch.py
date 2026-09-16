import re

with open("app/routers/groups.py", "r") as f:
    content = f.read()

# 1. add_expense
content = content.replace(
    "balances.process_expense_splits(db, group_id, expense, payload)\n    \n    db.commit()",
    "balances.process_expense_splits(db, group_id, expense, payload)\n    db.flush()\n    balances.apply_expense(db, expense)\n    db.commit()"
)

# 2. update_expense
update_repl = """
    # Revert old balance impact
    db.flush() # ensure old expense object has splits
    balances.revert_expense(db, expense)
    
    # Delete old splits
    db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id).delete()
    
    # Update fields
    expense.description = payload.description
    expense.amount = payload.amount
    expense.paid_by = payload.paid_by
    expense.category = payload.category
    expense.split_type = payload.split_type
    
    # Recreate splits
    balances.process_expense_splits(db, group_id, expense, payload)
    db.flush()
    
    # Apply new balance impact
    balances.apply_expense(db, expense)
    
    db.commit()
"""
content = re.sub(r'# Delete old splits[\s\S]*?db\.commit\(\)', update_repl.strip(), content)

# 3. delete_expense
del_repl = """
    balances.revert_expense(db, expense)
    db.delete(expense)
    db.commit()
"""
content = re.sub(r'db\.delete\(expense\)\s*db\.commit\(\)', del_repl.strip(), content)

# 4. add_settlement
add_settle = """
    db.add(settlement)
    balances.apply_settlement(db, settlement)
    db.commit()
"""
content = re.sub(r'db\.add\(settlement\)\s*db\.commit\(\)', add_settle.strip(), content)

# 5. update_settlement
update_settle = """
    balances.revert_settlement(db, settlement)
    
    settlement.from_member = payload.from_member
    settlement.to_member = payload.to_member
    settlement.amount = payload.amount
    
    balances.apply_settlement(db, settlement)
    db.commit()
"""
content = re.sub(r'settlement\.from_member = payload\.from_member\s*settlement\.to_member = payload\.to_member\s*settlement\.amount = payload\.amount\s*db\.commit\(\)', update_settle.strip(), content)

# 6. delete_settlement
del_settle = """
    balances.revert_settlement(db, settlement)
    db.delete(settlement)
    db.commit()
"""
content = re.sub(r'db\.delete\(settlement\)\s*db\.commit\(\)', del_settle.strip(), content)

with open("app/routers/groups.py", "w") as f:
    f.write(content)
