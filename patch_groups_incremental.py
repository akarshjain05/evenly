with open("app/routers/groups.py", "r") as f:
    content = f.read()

# I will just write a script that injects the balance updates exactly where they need to go.
# add_expense:
import re

add_exp_repl = """
    db.flush()
    
    # Apply to balances
    payer = db.query(models.Member).get(expense.paid_by)
    payer.balance += expense.amount
    splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id).all()
    for s in splits:
        sm = db.query(models.Member).get(s.member_id)
        sm.balance -= s.share_amount
        
    db.commit()
"""
content = content.replace("    db.commit()\n    db.refresh(expense)", add_exp_repl + "    db.refresh(expense)")

with open("app/routers/groups.py", "w") as f:
    f.write(content)
