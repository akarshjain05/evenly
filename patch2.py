import re
with open('app/services/activity_service.py', 'r') as f:
    content = f.read()

content = re.sub(
    r'    cursor_where = ""\n    params: Dict\[str, Any\] = \{"group_id": group_id, "limit": limit\}\n\n    if last_seen and \'\|\' in last_seen:.*?elif last_seen:.*?params\["last_seen"\] = last_seen\n',
    '',
    content,
    flags=re.DOTALL
)

content = content.replace('results = (await db.execute(query, params)).fetchall()', 'results = (await db.execute(query)).fetchall()')
with open('app/services/activity_service.py', 'w') as f:
    f.write(content)
