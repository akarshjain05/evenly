with open("app/balances.py", "r") as f:
    content = f.read()

content = content.replace(
    'return {m.id: Decimal(str(m.balance)).quantize(Decimal(\'0.01\')) for m in members}',
    'res = {m.id: Decimal(str(m.balance)).quantize(Decimal(\'0.01\')) for m in members}\n    print(f"BALANCES: {res}")\n    return res'
)

with open("app/balances.py", "w") as f:
    f.write(content)
