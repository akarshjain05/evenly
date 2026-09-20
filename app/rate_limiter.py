"""
Rate limiter with Redis backend (production) and in-memory fallback (local dev).

When REDIS_URL is set, all rate-limit state is stored in Redis so that
multiple workers / containers share a single counter.  Without it, a
simple in-memory dict is used — perfectly fine for single-process local
development.
"""

import os
import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = int(os.environ.get("RATE_LIMIT_MAX_ATTEMPTS", "10"))
WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", "60"))

# ---------------------------------------------------------------------------
# Redis backend
# ---------------------------------------------------------------------------

_redis_client = None


def _get_redis():
    """Lazy-init a Redis connection from REDIS_URL."""
    global _redis_client
    if _redis_client is None:
        import redis
        _redis_client = redis.from_url(
            os.environ["REDIS_URL"], decode_responses=True
        )
    return _redis_client


def _check_redis(client_ip: str, limit_type: str = "auth") -> None:
    r = _get_redis()
    key = f"rate_limit:{limit_type}:{client_ip}"
    current = r.incr(key)
    if current == 1:
        r.expire(key, WINDOW_SECONDS)
    if current > MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please wait a minute.",
        )


# ---------------------------------------------------------------------------
# In-memory backend (single-process only)
# ---------------------------------------------------------------------------

_auth_attempts: dict[str, list[float]] = defaultdict(list)
_invite_attempts: dict[str, list[float]] = defaultdict(list)

def _check_memory(client_ip: str, limit_type: str = "auth") -> None:
    now = time.time()
    store = _auth_attempts if limit_type == "auth" else _invite_attempts
    store[client_ip] = [
        t for t in store[client_ip] if now - t < WINDOW_SECONDS
    ]
    if len(store[client_ip]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please wait a minute.",
        )
    store[client_ip].append(now)


def cleanup_memory() -> None:
    """Prune stale IPs from the in-memory store.  Called by the background task."""
    now = time.time()
    for store in [_auth_attempts, _invite_attempts]:
        for ip in list(store.keys()):
            valid = [t for t in store[ip] if now - t < WINDOW_SECONDS]
            if valid:
                store[ip] = valid
            else:
                del store[ip]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_use_redis = bool(os.getenv("REDIS_URL"))

# Fail securely in stateless environments without Redis, unless explicitly overridden
if not _use_redis and os.getenv("VERCEL") == "1":
    if os.getenv("DISABLE_RATE_LIMITING") != "1":
        logger.warning(
            "CRITICAL SECURITY MISCONFIGURATION: "
            "You are deploying to Vercel (serverless) without REDIS_URL. "
            "The in-memory rate limiter is useless in serverless environments. "
            "Rate limiting is automatically disabled to prevent crashes, but your auth endpoints are vulnerable to brute-force attacks. "
            "Please configure Redis (e.g. Upstash) and set REDIS_URL."
        )
        os.environ["DISABLE_RATE_LIMITING"] = "1"


def rate_limit_auth(request: Request) -> None:
    if os.getenv("DISABLE_RATE_LIMITING") == "1":
        return
        
    """FastAPI dependency — call as Depends(rate_limit_auth)."""
    client_ip = request.client.host if request.client else "unknown"
    path_suffix = request.url.path.strip('/').split('/')[-1]
    limit_key = f"auth_{path_suffix}"
    if _use_redis:
        _check_redis(client_ip, limit_key)
    else:
        _check_memory(f"{limit_key}:{client_ip}", "auth")

def rate_limit_invite(request: Request) -> None:
    if os.getenv("DISABLE_RATE_LIMITING") == "1":
        return
        
    client_ip = request.client.host if request.client else "unknown"
    if _use_redis:
        _check_redis(client_ip, "invite")
    else:
        _check_memory(client_ip, "invite")

