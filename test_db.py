import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app import models, schemas
from app.services import group_service

async def main():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
        
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        user = models.User(email="test@test.com", password_hash="test", name="Test")
        db.add(user)
        await db.flush()
        
        group = models.Group(name="Trip")
        db.add(group)
        await db.flush()
        
        member = models.Member(user_id=user.id, group_id=group.id, name="Test", balance=0)
        db.add(member)
        await db.commit()
        
        payload = schemas.ExpenseCreate(
            description="Dinner",
            amount=1000.0,
            paid_by=member.id,
            split_type="equal"
        )
        
        class MockTasks:
            def add_task(self, *args, **kwargs):
                pass
                
        print("Running process_and_add_expense...")
        await group_service.process_and_add_expense(payload, group.id, user, member, db, MockTasks())
        print("Success!")

asyncio.run(main())
