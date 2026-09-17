with open("app/database.py", "r") as f:
    content = f.read()

content = content.replace('connect_args["ssl"] = True', 'connect_args["ssl"] = "require"')

with open("app/database.py", "w") as f:
    f.write(content)
