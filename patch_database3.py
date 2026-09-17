import re
with open("app/database.py", "r") as f:
    content = f.read()

content = content.replace("postgresql+asyncpg://", "postgresql+psycopg://")
content = content.replace("asyncpg", "psycopg")

with open("app/database.py", "w") as f:
    f.write(content)
