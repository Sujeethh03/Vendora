import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings
from exceptions import ConflictError, UnauthorizedError
from models.user import User, RefreshToken
from schemas.user import RegisterRequest


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _create_refresh_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    return raw, token_hash


async def register(db: AsyncSession, data: RegisterRequest) -> User:
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictError("Email already registered")

    user = User(
        email=data.email,
        password_hash=_hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login(db: AsyncSession, email: str, password: str) -> tuple[str, str]:
    result = await db.execute(
        select(User).where(User.email == email, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user or not _verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")

    access_token = _create_access_token(user.id)
    raw_refresh, token_hash = _create_refresh_token()

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    await db.commit()

    return access_token, raw_refresh


async def refresh(db: AsyncSession, raw_refresh_token: str) -> tuple[str, str]:
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise UnauthorizedError("Invalid or expired refresh token")

    # Revoke old token
    stored.revoked_at = datetime.now(timezone.utc)

    # Fetch user
    user_result = await db.execute(select(User).where(User.id == stored.user_id))
    user = user_result.scalar_one()

    # Issue new pair
    access_token = _create_access_token(user.id)
    raw_new, new_hash = _create_refresh_token()

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(user_id=user.id, token_hash=new_hash, expires_at=expires_at))
    await db.commit()

    return access_token, raw_new


async def logout(db: AsyncSession, raw_refresh_token: str) -> None:
    token_hash = hashlib.sha256(raw_refresh_token.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored = result.scalar_one_or_none()
    if stored:
        stored.revoked_at = datetime.now(timezone.utc)
        await db.commit()
