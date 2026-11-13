import os
import secrets
import string
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt, JWTError
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode("utf-8")
        # Ensure password is max 72 bytes as per bcrypt specification
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

def generate_secure_invite_code(prefix: str = "HACK", length: int = 12) -> str:
    """
    Generates a cryptographically secure, high-entropy invitation code.
    Example: HACK-8K9N-W2X7
    """
    chars = string.ascii_uppercase + string.digits
    safe_chars = "".join([c for c in chars if c not in "0O1I"])
    part1 = "".join(secrets.choice(safe_chars) for _ in range(4))
    part2 = "".join(secrets.choice(safe_chars) for _ in range(4))
    part3 = "".join(secrets.choice(safe_chars) for _ in range(4))
    return f"{prefix}-{part1}-{part2}-{part3}"
