import asyncio
from app.database import AsyncSessionLocal
from app import schemas, models
from app.services import group_service
from decimal import Decimal

async def main():
    async with AsyncSessionLocal() as db:
        # Get any user and group
        from sqlalchemy import select
        user = (await db.execute(select(models.User))).scalars().first()
        group = (await db.execute(select(models.Group))).scalars().first()
        member = (await db.execute(select(models.Member).filter(models.Member.group_id == group.id))).scalars().first()

        print(f"User: {user.name}")
        print(f"Group: {group.name}")
        print(f"Member: {member.name}")

        payload = schemas.ExpenseCreate(
            description="Dinner",
            amount=1000.0,
            paid_by=member.id,
            split_type="equal"
        )
        
        class MockTasks:
            def add_task(self, *args, **kwargs):
                pass
                
        try:
            await group_service.process_and_add_expense(payload, group.id, user, member, db, MockTasks())
            print("SUCCESS")
        except Exception as e:
            print(f"ERROR: {e}")

asyncio.run(main())
