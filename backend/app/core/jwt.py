from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from app.core.config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def create_access_token(email: str, expires_delta: timedelta | None = None) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    payload = {
        "sub": email,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
