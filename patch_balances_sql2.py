with open("app/balances.py", "r") as f:
    content = f.read()

import re
replacement = """
    query = text('''
        UPDATE members
        SET balance = 
            COALESCE((SELECT SUM(amount) FROM expenses WHERE paid_by = members.id AND group_id = :group_id), 0.0)
            - COALESCE((SELECT SUM(share_amount) FROM expense_splits JOIN expenses ON expenses.id = expense_splits.expense_id WHERE expense_splits.member_id = members.id AND expenses.group_id = :group_id), 0.0)
            + COALESCE((SELECT SUM(amount) FROM settlements WHERE from_member = members.id AND group_id = :group_id), 0.0)
            - COALESCE((SELECT SUM(amount) FROM settlements WHERE to_member = members.id AND group_id = :group_id), 0.0)
        
        WHERE group_id = :group_id
    ''')
    db.execute(query, {"group_id": group_id})
    db.expire_all()
    
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    return {m.id: Decimal(str(m.balance)).quantize(Decimal('0.01')) for m in members}
"""

content = re.sub(r'query = text\(\'\'\'[\s\S]*?return \{m\.id: Decimal\(str\(m\.balance\)\)\.quantize\(Decimal\(\'0\.01\'\)\) for m in members\}', replacement, content)

with open("app/balances.py", "w") as f:
    f.write(content)
