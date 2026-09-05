"""
Authentication helpers: password hashing and JWT issuing/verification.

Flow:
  1. Signup  -> password is hashed with bcrypt before being stored.
  2. Login   -> plaintext password is checked against the stored hash;
               on success a signed JWT access token is returned.
  3. Each protected route depends on `get_current_user`, which decodes
     the token from the Authorization header and loads that user.
"""

from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

# Tells FastAPI where clients get a token from (used for OpenAPI docs +
# for extracting the token out of the "Authorization: Bearer <token>" header).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# bcrypt only hashes the first 72 bytes of its input; anything past that
# is silently ignored. Truncating up front makes that limit explicit
# rather than a surprise, and keeps very long inputs from erroring out.
_MAX_PASSWORD_BYTES = 72


def hash_password(plain_password: str) -> str:
    """One-way hash a plaintext password for storage, using bcrypt directly.

    (Uses the `bcrypt` library's own API rather than the passlib wrapper —
    passlib is unmaintained and its internal self-test breaks on
    bcrypt>=4.1.)
    """
    truncated = plain_password.encode("utf-8")[:_MAX_PASSWORD_BYTES]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(truncated, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a login attempt's plaintext password against the stored hash."""
    truncated = plain_password.encode("utf-8")[:_MAX_PASSWORD_BYTES]
    return bcrypt.checkpw(truncated, hashed_password.encode("utf-8"))


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Build a signed JWT whose payload identifies the user (`sub`) and
    carries an expiry (`exp`). Signed with our secret key so it can't be
    forged or tampered with by the client.
    """
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency used on every protected route. Decodes the bearer
    token, pulls out the user's email (`sub`), and loads the matching
    User row — raising 401 if the token is invalid/expired or the user
    no longer exists.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_error
    return user
