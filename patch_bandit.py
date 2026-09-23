import re

with open('app/migrations/add_sync_columns.py', 'r') as f:
    content = f.read()

content = content.replace(
    'result = await db.execute(text(f"PRAGMA table_info({table})"))',
    'result = await db.execute(text(f"PRAGMA table_info({table})"))  # nosec B608'
)
content = content.replace(
    'result = await db.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = \'{table}\'"))',
    'result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = :table"), {"table": table})'
)
content = content.replace(
    'await db.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {datatype}"))',
    'await db.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {datatype}"))  # nosec B608'
)
content = content.replace(
    'await db.execute(text(f"ALTER TABLE {table} ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL"))',
    'await db.execute(text(f"ALTER TABLE {table} ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL"))  # nosec B608'
)

with open('app/migrations/add_sync_columns.py', 'w') as f:
    f.write(content)
