import re

with open('app/services/activity_service.py', 'r') as f:
    content = f.read()

new_content = re.sub(
    r'    query = text\(f\'\'\'.*?LIMIT :limit\n    \'\'\'\)',
    '''
    from sqlalchemy import union_all, literal_column
    
    # Base queries
    exp_q = select(
        literal_column("'expense'").label("type"),
        models.Expense.id,
        models.Expense.created_at
    ).where(models.Expense.group_id == group_id, models.Expense.is_deleted == False)
    
    set_q = select(
        literal_column("'settlement'").label("type"),
        models.Settlement.id,
        models.Settlement.created_at
    ).where(models.Settlement.group_id == group_id, models.Settlement.is_deleted == False)
    
    if last_seen and '|' in last_seen:
        last_seen_time, last_seen_id = last_seen.split('|', 1)
        # Apply cursor
        exp_q = exp_q.where((models.Expense.created_at < last_seen_time) | ((models.Expense.created_at == last_seen_time) & (models.Expense.id < last_seen_id)))
        set_q = set_q.where((models.Settlement.created_at < last_seen_time) | ((models.Settlement.created_at == last_seen_time) & (models.Settlement.id < last_seen_id)))
    elif last_seen:
        exp_q = exp_q.where(models.Expense.created_at < last_seen)
        set_q = set_q.where(models.Settlement.created_at < last_seen)
        
    query = union_all(exp_q, set_q).order_by(text("created_at DESC"), text("id DESC")).limit(limit)
    ''',
    content,
    flags=re.DOTALL
)

with open('app/services/activity_service.py', 'w') as f:
    f.write(new_content)
