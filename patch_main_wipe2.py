import re

with open('app/main.py', 'r') as f:
    content = f.read()

new_endpoint = """
@app.get("/api/wipe2")
async def wipe_all_data2():
    from fastapi import Depends
    from sqlalchemy.ext.asyncio import AsyncSession
    from app import database
    
    # We create a manual session since Depends won't resolve correctly here without imports at the top
    async with database.AsyncSessionLocal() as db:
        from sqlalchemy import text
        try:
            await db.execute(text("TRUNCATE TABLE users, groups, members, expenses, expense_splits, settlements, push_subscriptions CASCADE"))
            await db.commit()
            return {"status": "Database completely wiped. You can now start fresh."}
        except Exception as e:
            await db.rollback()
            return {"status": "Error", "detail": str(e)}

@app.get("/api/debug/wipe-all-data-confirm")
"""

content = content.replace('@app.get("/api/debug/wipe-all-data-confirm")', new_endpoint)

with open('app/main.py', 'w') as f:
    f.write(content)
