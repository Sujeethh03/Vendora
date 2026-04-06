#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Run from vendora-backend/:
    python create_admin.py
"""
import asyncio
import sys
import uuid
import bcrypt
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from config import settings
from models.user import User


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


async def create_admin(email: str, password: str) -> None:
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            print(f"\n[!] A user with email '{email}' already exists.")
            await engine.dispose()
            return

        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash=_hash_password(password),
            is_admin=True,
        )
        session.add(user)
        await session.commit()

    await engine.dispose()

    print("\n" + "=" * 40)
    print("  Admin account created successfully")
    print("=" * 40)
    print(f"  Email    : {email}")
    print(f"  Password : {password}")
    print("=" * 40 + "\n")


def prompt(label: str, hidden: bool = False) -> str:
    if hidden:
        import getpass
        return getpass.getpass(f"{label}: ").strip()
    value = input(f"{label}: ").strip()
    if not value:
        print(f"[!] {label} cannot be empty.")
        sys.exit(1)
    return value


if __name__ == "__main__":
    # Usage: python3 create_admin.py email password
    # Or run interactively with no args
    if len(sys.argv) == 3:
        email = sys.argv[1].strip()
        password = sys.argv[2].strip()
    else:
        print("\n=== Vendora Admin Setup ===\n")
        email = prompt("Admin email")
        password = prompt("Password", hidden=True)
        confirm = prompt("Confirm password", hidden=True)
        if password != confirm:
            print("[!] Passwords do not match.")
            sys.exit(1)

    if not email:
        print("[!] Email cannot be empty.")
        sys.exit(1)

    if len(password) < 8:
        print("[!] Password must be at least 8 characters.")
        sys.exit(1)

    asyncio.run(create_admin(email, password))
