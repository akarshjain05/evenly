import re

with open('app/services/settlement_service.py', 'r') as f:
    content = f.read()

old_func = """async def process_and_add_settlement(payload: schemas.SettlementCreate, group_id: str, user: models.User, member: models.Member, db: AsyncSession, background_tasks):
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())"""

new_func = """async def process_and_add_settlement(payload: schemas.SettlementCreate, group_id: str, user: models.User, member: models.Member, db: AsyncSession, background_tasks):
    user_id = user.id
    result = await db.execute(select(models.Member).filter(models.Member.group_id == group_id).with_for_update())"""

content = content.replace(old_func, new_func)

content = content.replace("created_by_user_id=user.id", "created_by_user_id=user_id")

with open('app/services/settlement_service.py', 'w') as f:
    f.write(content)
