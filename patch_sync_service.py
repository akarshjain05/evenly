import re

with open('app/services/sync_service.py', 'r') as f:
    content = f.read()

content = content.replace(
    'group_id = data.get("group_id")',
    'group_id = data.get("group_id") or mutation.get("group_id")'
)

with open('app/services/sync_service.py', 'w') as f:
    f.write(content)
