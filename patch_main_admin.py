with open("app/main.py", "r") as f:
    content = f.read()

content = content.replace(
    "from app.routers import auth, users, groups, notifications",
    "from app.routers import auth, users, groups, notifications, admin_kill"
)
content = content.replace(
    "app.include_router(groups.router)",
    "app.include_router(groups.router)\napp.include_router(admin_kill.router)"
)

with open("app/main.py", "w") as f:
    f.write(content)
