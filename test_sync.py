import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import Base, Group, Member, User, Expense, ExpenseSplit, SplitType
from app.routers.sync import get_sync

async def main():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        user = User(id="u1", email="test@test.com", password_hash="hash")
        group = Group(id="g1", name="Test Group")
        member = Member(id="m1", user_id="u1", group_id="g1", name="Test")
        expense = Expense(id="e1", group_id="g1", description="Test", amount=100, paid_by="m1", split_type=SplitType.equal)
        split = ExpenseSplit(id="s1", expense_id="e1", member_id="m1", share_amount=100)
        
        db.add_all([user, group, member, expense, split])
        await db.commit()
        
        res = await get_sync(since=None, user=user, db=db)
        print(res)

asyncio.run(main())
