import re

with open('frontend/src/db/hooks.ts', 'r') as f:
    content = f.read()

old_filter = "      .filter(m => m.user_id === userId && m.is_deleted === false)"
new_filter = "      .filter(m => m.user_id === userId && m.is_deleted !== true)"

content = content.replace(old_filter, new_filter)

with open('frontend/src/db/hooks.ts', 'w') as f:
    f.write(content)
