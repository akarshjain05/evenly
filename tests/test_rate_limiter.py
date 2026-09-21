import pytest
from app import rate_limiter

def test_auth_rate_limiting(client):
    # Disable the mock just for this test
    # Wait, the clear_rate_limits fixture runs autouse! So it clears the limit before each test.
    # We can just hit it multiple times inside the same test!
    
    # We need to hit the login endpoint more than 10 times (or whatever RATE_LIMIT_MAX_ATTEMPTS is)
    # Wait, RATE_LIMIT_MAX_ATTEMPTS is 100 in the test env! So we hit it 101 times.
    # To make the test faster, we can monkeypatch RATE_LIMIT_MAX_ATTEMPTS or just loop 101 times.
    # 101 loops of a failed login is extremely fast in memory.
    
    for _ in range(101):
        res = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "wrong"})
        if res.status_code == 429:
            assert "Too many attempts. Please wait a minute." in res.json()["detail"]
            return
            
    assert False, "Rate limit 429 was never triggered after 101 attempts"

