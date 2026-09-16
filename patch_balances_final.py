with open("app/balances.py", "r") as f:
    content = f.read()

import re
replacement = """def compute_net_balances(db: Session, group_id: str) -> Dict[str, Decimal]:
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    return {m.id: Decimal(str(m.balance)).quantize(Decimal('0.01')) for m in members}
"""

content = re.sub(r'def recalculate_balances[\s\S]*?return res', replacement, content)

with open("app/balances.py", "w") as f:
    f.write(content)
