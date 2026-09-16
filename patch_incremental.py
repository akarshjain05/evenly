import re

with open("app/balances.py", "r") as f:
    content = f.read()

# Replace recalculate_balances with a simple read function
replacement = """
def compute_net_balances(db: Session, group_id: str) -> Dict[str, Decimal]:
    members = db.query(models.Member).filter(models.Member.group_id == group_id).all()
    return {m.id: Decimal(str(m.balance)).quantize(Decimal('0.01')) for m in members}
"""

content = re.sub(r'def recalculate_balances[\s\S]*?return \{m\.id: Decimal\(str\(m\.balance\)\)\.quantize\(Decimal\(\'0\.01\'\)\) for m in members\}', replacement, content)
content = content.replace("from sqlalchemy import text\n", "")

with open("app/balances.py", "w") as f:
    f.write(content)
