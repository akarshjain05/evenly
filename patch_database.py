with open("app/database.py", "r") as f:
    content = f.read()

import re

# We will just pass connect_args={"ssl": True} if it's asyncpg
new_code = """
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
if "asyncpg" in DATABASE_URL:
    connect_args["ssl"] = True

engine = create_async_engine(DATABASE_URL, connect_args=connect_args)
"""

content = re.sub(r'connect_args = \{.*?engine = create_async_engine\(DATABASE_URL, connect_args=connect_args\)', new_code.strip(), content, flags=re.DOTALL)

with open("app/database.py", "w") as f:
    f.write(content)
