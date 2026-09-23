import re

with open('app/balances.py', 'r') as f:
    content = f.read()

old_stmt = "stmt = update(models.Member).where(models.Member.id == bindparam('b_id')).values(balance=bindparam('b_balance'), updated_at=func.now())"
new_stmt = "stmt = update(models.Member).where(models.Member.id == bindparam('b_id')).values(balance=bindparam('b_balance'), updated_at=func.now()).execution_options(synchronize_session=False)"

content = content.replace(old_stmt, new_stmt)

with open('app/balances.py', 'w') as f:
    f.write(content)
