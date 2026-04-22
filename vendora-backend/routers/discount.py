import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user, require_admin
from models.user import User
from schemas.discount import (
    DiscountCreate, DiscountUpdate, DiscountOut,
    ValidateDiscountRequest, ValidateDiscountOut,
)
from services import discount as discount_service

router = APIRouter(prefix="/discounts", tags=["discounts"])


@router.post("/validate", response_model=ValidateDiscountOut)
async def validate_discount(
    data: ValidateDiscountRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await discount_service.validate_discount(db, user.id, data.code, data.subtotal)


@router.get("", response_model=list[DiscountOut])
async def list_discounts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await discount_service.list_discounts(db)


@router.post("", response_model=DiscountOut, status_code=201)
async def create_discount(
    data: DiscountCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await discount_service.create_discount(db, data)


@router.get("/{discount_id}", response_model=DiscountOut)
async def get_discount(
    discount_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await discount_service.get_discount(db, discount_id)


@router.put("/{discount_id}", response_model=DiscountOut)
async def update_discount(
    discount_id: uuid.UUID,
    data: DiscountUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await discount_service.update_discount(db, discount_id, data)


@router.delete("/{discount_id}", status_code=204)
async def delete_discount(
    discount_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await discount_service.delete_discount(db, discount_id)
