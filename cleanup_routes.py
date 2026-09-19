import os

# 1. Delete admin_kill.py
admin_kill_path = 'app/routers/admin_kill.py'
if os.path.exists(admin_kill_path):
    os.remove(admin_kill_path)
    print(f"Deleted {admin_kill_path}")

# 2. Update app/main.py
with open('app/main.py', 'r') as f:
    lines = f.readlines()

new_lines = []
skip_mode = False
for i, line in enumerate(lines):
    # Remove import
    if "from app.routers import auth, users, groups, notifications, admin_kill" in line:
        new_lines.append(line.replace(", admin_kill", ""))
        continue
    
    # Remove include_router
    if "app.include_router(admin_kill.router)" in line:
        continue

    # Remove migrate routes
    if "@app.get(\"/api/migrate\")" in line or "@app.get(\"/api/migrate2\")" in line or "@app.get(\"/api/migrate3\")" in line:
        skip_mode = True
        
    if skip_mode:
        # We need to detect when the route ends. The routes end before another @app.get or when we hit the health route
        if i > 0 and line.startswith("@app.get(\"/api/health\")"):
            skip_mode = False
            new_lines.append(line)
        continue

    new_lines.append(line)

with open('app/main.py', 'w') as f:
    f.writelines(new_lines)
print("Updated app/main.py")

