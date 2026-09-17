with open("app/routers/users.py", "r") as f:
    content = f.read()

import re

old_code = """
    result = await db.execute(
        select(models.User).options(
            selectinload(models.User.memberships).selectinload(models.Member.group)
        ).filter(models.User.id == user.id)
    )
    user = result.scalars().first()
    return [
        {
            "group": {"id": m.group.id, "name": m.group.name, "invite_code": m.group.invite_code},
            "member": {"id": m.id, "name": m.name, "color": m.color}
        }
        for m in user.memberships
    ]
"""

new_code = """
    result = await db.execute(
        select(models.Member).options(selectinload(models.Member.group)).filter(models.Member.user_id == user.id)
    )
    members = result.scalars().all()
    return [
        {
            "group": {"id": m.group.id, "name": m.group.name, "invite_code": m.group.invite_code},
            "member": {"id": m.id, "name": m.name, "color": m.color}
        }
        for m in members
    ]
"""

content = content.replace(old_code.strip(), new_code.strip())

with open("app/routers/users.py", "w") as f:
    f.write(content)
