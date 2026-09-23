import re

with open('app/services/settlement_service.py', 'r') as f:
    content = f.read()

content = content.replace(
    'async def process_and_update_settlement(group_id: str, settlement_id: str, payload: schemas.SettlementCreate, db: AsyncSession, member: models.Member):\n    result = await',
    'async def process_and_update_settlement(group_id: str, settlement_id: str, payload: schemas.SettlementCreate, db: AsyncSession, member: models.Member):\n    member_id = member.id\n    member_is_admin = member.is_admin\n    member_user_id = member.user_id\n    result = await'
)
content = content.replace('if not member.is_admin and settlement.created_by_user_id != member.user_id and settlement.from_member != member.id and settlement.to_member != member.id', 'if not member_is_admin and settlement.created_by_user_id != member_user_id and settlement.from_member != member_id and settlement.to_member != member_id')
content = content.replace('if not member.is_admin', 'if not member_is_admin')
content = content.replace('member.user_id', 'member_user_id')
content = content.replace('member.id', 'member_id')

content = content.replace(
    'async def process_and_delete_settlement(group_id: str, settlement_id: str, db: AsyncSession, member_id_param: str, member_is_admin: bool, member_user_id: str):\n    result = await',
    'async def process_and_delete_settlement(group_id: str, settlement_id: str, db: AsyncSession, member: models.Member):\n    member_id = member.id\n    member_is_admin = member.is_admin\n    member_user_id = member.user_id\n    result = await'
)
content = content.replace(
    'async def process_and_delete_settlement(group_id: str, settlement_id: str, db: AsyncSession, member: models.Member):\n    result = await',
    'async def process_and_delete_settlement(group_id: str, settlement_id: str, db: AsyncSession, member: models.Member):\n    member_id = member.id\n    member_is_admin = member.is_admin\n    member_user_id = member.user_id\n    result = await'
)


with open('app/services/settlement_service.py', 'w') as f:
    f.write(content)
