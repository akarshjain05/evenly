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

MAX_ATTEMPTS = 10
WINDOW_SECONDS = 60

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


def _check_redis(client_ip: str) -> None:
    r = _get_redis()
    key = f"rate_limit:auth:{client_ip}"
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


def _check_memory(client_ip: str) -> None:
    now = time.time()
    _auth_attempts[client_ip] = [
        t for t in _auth_attempts[client_ip] if now - t < WINDOW_SECONDS
    ]
    if len(_auth_attempts[client_ip]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please wait a minute.",
        )
    _auth_attempts[client_ip].append(now)


def cleanup_memory() -> None:
    """Prune stale IPs from the in-memory store.  Called by the background task."""
    now = time.time()
    for ip in list(_auth_attempts.keys()):
        valid = [t for t in _auth_attempts[ip] if now - t < WINDOW_SECONDS]
        if valid:
            _auth_attempts[ip] = valid
        else:
            del _auth_attempts[ip]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_use_redis = bool(os.getenv("REDIS_URL"))


def rate_limit_auth(request: Request) -> None:
    """FastAPI dependency — call as Depends(rate_limit_auth)."""
    client_ip = request.client.host if request.client else "unknown"
    if _use_redis:
        _check_redis(client_ip)
    else:
        _check_memory(client_ip)
