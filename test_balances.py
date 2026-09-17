import asyncio
from app.balances import simplify_debts
from decimal import Decimal

net = {"A": Decimal("10.50"), "B": Decimal("-10.50")}
print(simplify_debts(net))

net2 = {"A": Decimal("33.33"), "B": Decimal("33.34"), "C": Decimal("-66.67")}
print(simplify_debts(net2))
