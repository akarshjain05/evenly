import os
import time
import logging
from app.rate_limiter import _get_redis, _use_redis

logger = logging.getLogger(__name__)

_memory_blocklist = {}

def block_token(jti: str, exp: int):
    """Add a token JTI to the blocklist until it naturally expires."""
    if _use_redis:
        try:
            r = _get_redis()
            ttl = max(1, exp - int(time.time()))
            r.setex(f"blocklist:{jti}", ttl, "1")
        except Exception:
            logger.error("Redis blocklist failure", exc_info=True)
    else:
        _memory_blocklist[jti] = exp

def is_token_blocked(jti: str) -> bool:
    """Check if a token JTI is blocked."""
    if not jti:
        return False
        
    if _use_redis:
        try:
            r = _get_redis()
            return r.exists(f"blocklist:{jti}") > 0
        except Exception:
            logger.error("Redis blocklist read failure", exc_info=True)
            return False
    else:
        now = int(time.time())
        if jti in _memory_blocklist:
            if _memory_blocklist[jti] < now:
                del _memory_blocklist[jti]
                return False
            return True
        return False

def cleanup_memory():
    if not _use_redis:
        now = int(time.time())
        expired = [k for k, v in _memory_blocklist.items() if v < now]
        for k in expired:
            del _memory_blocklist[k]
