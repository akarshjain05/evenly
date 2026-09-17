with open("app/routers/groups.py", "r") as f:
    content = f.read()

import_str = "import traceback\n"
if "import traceback" not in content:
    content = import_str + content

replacement = """
    try:
        await group_service.process_and_add_expense(payload, group_id, user, member, db, background_tasks)
    except Exception as e:
        import traceback
        raise HTTPException(status_code=400, detail=traceback.format_exc())
"""

content = content.replace(
    "await group_service.process_and_add_expense(payload, group_id, user, member, db, background_tasks)",
    replacement
)

with open("app/routers/groups.py", "w") as f:
    f.write(content)
