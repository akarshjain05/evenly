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
os.environ['TESTING'] = '1'
import pytest
from app import rate_limiter
from fastapi.testclient import TestClient
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.database import Base, get_db
from app import models
import atexit

TEST_DB_PATH = "./test_app.db"
if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)

def cleanup():
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except:
            pass
atexit.register(cleanup)

SQLALCHEMY_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

import app.database as app_db
app_db.engine = engine

from alembic import command
from alembic.config import Config
alembic_cfg = Config("alembic.ini")
command.upgrade(alembic_cfg, "head")

async def override_get_db():
    async with TestingSessionLocal() as db:
        yield db

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    test_client = TestClient(app)
    original_request = test_client.request
    def secure_request(method, url, **kwargs):
        if method.upper() in ["POST", "PUT", "DELETE", "PATCH"]:
            if not test_client.cookies.get("csrf_token"):
                test_client.get("/") 
            headers = kwargs.get("headers") or {}
            csrf_token = test_client.cookies.get("csrf_token")
            if csrf_token and "X-CSRF-Token" not in headers:
                headers["X-CSRF-Token"] = csrf_token
                req_cookies = kwargs.get("cookies") or {}
                req_cookies["csrf_token"] = csrf_token
                kwargs["cookies"] = req_cookies
            kwargs["headers"] = headers
        return original_request(method, url, **kwargs)
    test_client.request = secure_request
    return test_client

@pytest.fixture(autouse=True)
def clear_rate_limits():
    rate_limiter._auth_attempts.clear()
    rate_limiter._invite_attempts.clear()

@pytest.fixture(autouse=True)
def clear_database():
    async def _clear():
        async with engine.begin() as conn:
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(table.delete())
    asyncio.run(_clear())
    yield

@pytest.fixture
def auth_user(client):
    res = client.post("/api/auth/register", json={"name": "Alice", "email": "alice@example.com", "password": "password123"})
    assert res.status_code == 200
    token = res.cookies.get("access_token")
    return {"name": "Alice", "email": "alice@example.com", "token": token, "cookies": {"access_token": token}}

@pytest.fixture
def auth_user_2(client):
    res = client.post("/api/auth/register", json={"name": "Bob", "email": "bob@example.com", "password": "password123"})
    assert res.status_code == 200
    token = res.cookies.get("access_token")
    return {"name": "Bob", "email": "bob@example.com", "token": token, "cookies": {"access_token": token}}

@pytest.fixture
def populated_group(client, auth_user, auth_user_2):
    # User 1 creates group
    res = client.post("/api/groups", json={"name": "Trip", "your_name": "Alice"}, cookies=auth_user["cookies"])
    assert res.status_code == 200
    group_id = res.json()["group"]["id"]
    invite_code = res.json()["group"]["invite_code"]
    
    # User 2 joins group
    res2 = client.post(f"/api/groups/by-code/{invite_code}/join", json={"name": "Bob"}, cookies=auth_user_2["cookies"])
    assert res2.status_code == 200
    
    # Fetch details to get member IDs
    res3 = client.get(f"/api/groups/{group_id}", cookies=auth_user["cookies"])
    data = res3.json()
    members = data["members"]
    alice_id = next(m["id"] for m in members if m["name"] == "Alice")
    bob_id = next(m["id"] for m in members if m["name"] == "Bob")
    
    return {
        "group_id": group_id,
        "invite_code": invite_code,
        "user1": auth_user,
        "user2": auth_user_2,
        "member1_id": alice_id,
        "member2_id": bob_id
    }
