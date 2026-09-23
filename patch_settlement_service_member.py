import re

with open('app/services/settlement_service.py', 'r') as f:
    content = f.read()

content = content.replace(
    'user_id = user.id\n    result = await',
    'user_id = user.id\n    member_id = member.id\n    member_name = member.name\n    result = await'
)
content = content.replace('m.id != member.id', 'm.id != member_id')
content = content.replace('{member.name}', '{member_name}')
content = content.replace('if member and not member.is_admin and settlement.created_by_user_id != member.user_id', 'if member and not member.is_admin and settlement.created_by_user_id != user_id')

with open('app/services/settlement_service.py', 'w') as f:
    f.write(content)
