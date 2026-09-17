import re
with open("app/database.py", "r") as f:
    content = f.read()

content = content.replace("postgresql+psycopg://", "postgresql+asyncpg://")
content = content.replace('connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}', 'connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}\nif "asyncpg" in DATABASE_URL:\n    connect_args["ssl"] = "require"')

with open("app/database.py", "w") as f:
    f.write(content)
