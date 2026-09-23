import re

with open('app/services/expense_service.py', 'r') as f:
    content = f.read()

content = content.replace(
    'async def process_and_update_expense(group_id: str, expense_id: str, payload: schemas.ExpenseCreate, db: AsyncSession, member: models.Member):\n    members_res = await',
    'async def process_and_update_expense(group_id: str, expense_id: str, payload: schemas.ExpenseCreate, db: AsyncSession, member: models.Member):\n    member_id = member.id\n    member_is_admin = member.is_admin\n    member_user_id = member.user_id\n    members_res = await'
)
content = content.replace('if not member.is_admin and expense.created_by_user_id != member.user_id and expense.paid_by != member.id', 'if not member_is_admin and expense.created_by_user_id != member_user_id and expense.paid_by != member_id')

content = content.replace(
    'async def process_and_delete_expense(group_id: str, expense_id: str, db: AsyncSession, member: models.Member):\n    result = await',
    'async def process_and_delete_expense(group_id: str, expense_id: str, db: AsyncSession, member: models.Member):\n    member_id = member.id\n    member_is_admin = member.is_admin\n    member_user_id = member.user_id\n    result = await'
)
with open('app/services/expense_service.py', 'w') as f:
    f.write(content)
