import re

with open('app/routers/sync.py', 'r') as f:
    content = f.read()

content = content.replace(
    '''    if not group_ids:
        return {
            "groups": [],
            "members": [],
            "expenses": [],
            "expense_splits": [],
            "settlements": [],
            "server_timestamp": format_datetime(datetime.now(timezone.utc))
        }

    since_dt = None''',
    '''    if not group_ids:
        return {
            "groups": [],
            "members": [],
            "expenses": [],
            "expense_splits": [],
            "settlements": [],
            "server_timestamp": format_datetime(datetime.now(timezone.utc))
        }

    # Auto-reconcile on full sync to heal corrupted balances from past bugs
    if not since:
        from app import balances
        for g_id in group_ids:
            await balances.recompute_balances_from_ledger(db, g_id)
        await db.commit()

    since_dt = None'''
)

with open('app/routers/sync.py', 'w') as f:
    f.write(content)
