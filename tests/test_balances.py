
import os
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_app.db"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "43200"
os.environ["COOKIE_MAX_AGE_SEC"] = "2592000"
os.environ["RATE_LIMIT_MAX_ATTEMPTS"] = "100"
os.environ["RATE_LIMIT_WINDOW_SECONDS"] = "60"
os.environ["VAPID_CLAIMS_EMAIL"] = "test@example.com"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

import json
import os
from decimal import Decimal
from app.balances import simplify_debts

def test_balances_contract():
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "balances_scenarios.json")
    with open(fixture_path, "r") as f:
        scenarios = json.load(f)

    for scenario in scenarios:
        # Convert input to the format expected by simplify_debts: dict of {member_id: Decimal(balance)}
        net_balances = {m["id"]: Decimal(m["balance"]) for m in scenario["input"]}
        
        result = simplify_debts(net_balances)
        
        # Format the result to match JSON types (float for amount)
        formatted_result = [
            {
                "from_member": r["from_member"],
                "to_member": r["to_member"],
                "amount": float(r["amount"])
            }
            for r in result
        ]
        
        def sort_key(item):
            return (-item["amount"], item["from_member"], item["to_member"])
            
        assert sorted(formatted_result, key=sort_key) == sorted(scenario["expected"], key=sort_key)
