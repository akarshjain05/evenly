import re

with open('app/balances.py', 'r') as f:
    content = f.read()

new_content = re.sub(
    r'    from sqlalchemy import text\n    query = text\(\'\'\'.*?GROUP BY member_id\n    \'\'\'\)\n    result = await db.execute\(query, \{"group_id": group_id\}\)',
    '''
    from sqlalchemy import union_all, literal_column, select
    
    q1 = select(
        models.Expense.paid_by.label("member_id"), 
        models.Expense.amount.label("amount")
    ).where(models.Expense.group_id == group_id, models.Expense.is_deleted == False)
    
    q2 = select(
        models.ExpenseSplit.member_id.label("member_id"),
        (-models.ExpenseSplit.share_amount).label("amount")
    ).select_from(models.ExpenseSplit).join(
        models.Expense, models.Expense.id == models.ExpenseSplit.expense_id
    ).where(models.Expense.group_id == group_id, models.Expense.is_deleted == False)
    
    q3 = select(
        models.Settlement.from_member.label("member_id"),
        models.Settlement.amount.label("amount")
    ).where(models.Settlement.group_id == group_id, models.Settlement.is_deleted == False)
    
    q4 = select(
        models.Settlement.to_member.label("member_id"),
        (-models.Settlement.amount).label("amount")
    ).where(models.Settlement.group_id == group_id, models.Settlement.is_deleted == False)
    
    subq = union_all(q1, q2, q3, q4).subquery("ledger")
    
    query = select(
        subq.c.member_id,
        func.sum(subq.c.amount).label("net_balance")
    ).where(subq.c.member_id.isnot(None)).group_by(subq.c.member_id)
    
    result = await db.execute(query)
    ''',
    content,
    flags=re.DOTALL
)

# And fix the bindparam typo I discovered earlier!
new_content = new_content.replace(
    "stmt = update(models.Member).where(models.Member.id == bindparam('b_id')).values(balance=bindparam('b_balance', updated_at=func.now()))",
    "stmt = update(models.Member).where(models.Member.id == bindparam('b_id')).values(balance=bindparam('b_balance'), updated_at=func.now())"
)

with open('app/balances.py', 'w') as f:
    f.write(new_content)
