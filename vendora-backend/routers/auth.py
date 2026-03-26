from fastapi import APIRouter, Depends, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.user import RegisterRequest, LoginRequest, UserOut
from services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_OPTS = dict(httponly=True, samesite="lax", secure=False)  # set secure=True in prod


@router.post("/register", response_model=UserOut, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register(db, data)
    return user


@router.post("/login")
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    access_token, refresh_token = await auth_service.login(db, data.email, data.password)
    response.set_cookie("access_token", access_token, max_age=15 * 60, **COOKIE_OPTS)
    response.set_cookie("refresh_token", refresh_token, max_age=7 * 24 * 3600, **COOKIE_OPTS)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 15 * 60,
    }


@router.post("/refresh")
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    from exceptions import UnauthorizedError
    if not refresh_token:
        raise UnauthorizedError("No refresh token")
    access_token, new_refresh = await auth_service.refresh(db, refresh_token)
    response.set_cookie("access_token", access_token, max_age=15 * 60, **COOKIE_OPTS)
    response.set_cookie("refresh_token", new_refresh, max_age=7 * 24 * 3600, **COOKIE_OPTS)
    return {"message": "Tokens refreshed"}


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    if refresh_token:
        await auth_service.logout(db, refresh_token)
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
