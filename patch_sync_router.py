import re

with open('app/routers/sync.py', 'r') as f:
    content = f.read()

# Add recompute_balances_from_ledger to push_sync
content = content.replace(
    '''    applied, rejected = await process_sync_mutations(
        mutations, user_group_ids, user_memberships, user, db, background_tasks
    )

    return {''',
    '''    applied, rejected = await process_sync_mutations(
        mutations, user_group_ids, user_memberships, user, db, background_tasks
    )
    
    # Auto-reconcile to heal corrupted balances from past bugs
    from app import balances
    affected_groups = {m.get("data", {}).get("group_id") or m.get("group_id") for m in mutations}
    affected_groups = {g for g in affected_groups if g in user_group_ids}
    for g_id in affected_groups:
        await balances.recompute_balances_from_ledger(db, g_id)
        
    await db.commit()

    return {'''
)

with open('app/routers/sync.py', 'w') as f:
    f.write(content)
