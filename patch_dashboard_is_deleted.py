import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'await db.members.put({ ...res.data.member, updated_at: new Date().toISOString() });',
    'await db.members.put({ ...res.data.member, is_deleted: false, updated_at: new Date().toISOString() });'
)

with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
