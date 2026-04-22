import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.order import PlaceOrderRequest, OrderOut, OrderListOut
from schemas.payment import CheckoutSessionOut
from services import order as order_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=CheckoutSessionOut, status_code=201)
async def place_order(
    data: PlaceOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await order_service.place_order(db, user.id, data)


@router.get("", response_model=OrderListOut)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await order_service.list_orders(db, user.id, page, page_size)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await order_service.get_order(db, user.id, order_id)
