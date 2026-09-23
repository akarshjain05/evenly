import re

with open('app/main.py', 'r') as f:
    content = f.read()

wipe_endpoint = """
@app.get("/api/debug/wipe-all-data-confirm")
async def wipe_all_data(db: AsyncSession = Depends(database.get_db)):
    from sqlalchemy import text
    try:
        await db.execute(text("TRUNCATE TABLE users, groups, members, expenses, expense_splits, settlements, push_subscriptions CASCADE"))
        await db.commit()
        return {"status": "Database completely wiped. You can now start fresh."}
    except Exception as e:
        await db.rollback()
        return {"status": "Error", "detail": str(e)}

app.include_router(auth.router)
"""

content = content.replace('app.include_router(auth.router)', wipe_endpoint)

with open('app/main.py', 'w') as f:
    f.write(content)
