import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.cart import AddToCartRequest, CartOut
from services import cart as cart_service

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartOut)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await cart_service.get_cart(db, user.id)


@router.post("/items", response_model=CartOut)
async def add_to_cart(
    data: AddToCartRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await cart_service.add_to_cart(db, user.id, data.product_id, data.quantity)


@router.delete("/items/{product_id}", status_code=204)
async def remove_from_cart(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await cart_service.remove_from_cart(db, user.id, product_id)


@router.delete("", status_code=204)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await cart_service.clear_cart(db, user.id)
