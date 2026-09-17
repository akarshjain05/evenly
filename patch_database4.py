with open("app/database.py", "r") as f:
    lines = f.readlines()

with open("app/database.py", "w") as f:
    for line in lines:
        if 'if "psycopg" in DATABASE_URL:' in line or 'connect_args["ssl"] = "require"' in line:
            continue
        f.write(line)
