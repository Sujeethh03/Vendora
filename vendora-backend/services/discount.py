import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from exceptions import NotFoundError, AppException
from models.discount import Discount, DiscountUsage
from schemas.discount import (
    DiscountCreate, DiscountUpdate, DiscountOut, ValidateDiscountOut
)


async def validate_discount(
    db: AsyncSession,
    user_id: uuid.UUID,
    code: str,
    subtotal: float,
) -> ValidateDiscountOut:
    result = await db.execute(
        select(Discount).where(Discount.code == code.strip().upper())
    )
    discount = result.scalar_one_or_none()
    if not discount:
        raise AppException(404, "Coupon not found")

    now = datetime.now(timezone.utc)

    if not discount.is_active:
        raise AppException(400, "Coupon is inactive")
    if now < discount.valid_from:
        raise AppException(400, "Coupon is not yet valid")
    if discount.valid_until and now > discount.valid_until:
        raise AppException(400, "Coupon has expired")
    if discount.min_order_amount and subtotal < float(discount.min_order_amount):
        raise AppException(
            400,
            f"Minimum order of ₹{discount.min_order_amount:.0f} required to use this coupon",
        )

    if discount.max_uses is not None:
        total_uses = (await db.execute(
            select(func.count(DiscountUsage.id)).where(DiscountUsage.discount_id == discount.id)
        )).scalar_one()
        if total_uses >= discount.max_uses:
            raise AppException(400, "Coupon usage limit reached")

    per_user_uses = (await db.execute(
        select(func.count(DiscountUsage.id)).where(
            DiscountUsage.discount_id == discount.id,
            DiscountUsage.user_id == user_id,
        )
    )).scalar_one()
    if per_user_uses >= discount.max_uses_per_user:
        raise AppException(400, "You've already used this coupon")

    if discount.discount_type == "percentage":
        applied_amount = min(subtotal * float(discount.value) / 100, subtotal)
    else:
        applied_amount = min(float(discount.value), subtotal)

    applied_amount = round(applied_amount, 2)

    return ValidateDiscountOut(
        discount_id=discount.id,
        code=discount.code,
        discount_type=discount.discount_type,
        value=float(discount.value),
        applied_amount=applied_amount,
        final_amount=round(subtotal - applied_amount, 2),
    )


async def create_discount(db: AsyncSession, data: DiscountCreate) -> Discount:
    existing = await db.execute(select(Discount).where(Discount.code == data.code))
    if existing.scalar_one_or_none():
        raise AppException(400, f"Coupon code '{data.code}' already exists")
    discount = Discount(**data.model_dump())
    db.add(discount)
    await db.commit()
    await db.refresh(discount)
    return discount


async def list_discounts(db: AsyncSession) -> list[Discount]:
    result = await db.execute(select(Discount).order_by(Discount.created_at.desc()))
    return list(result.scalars().all())


async def get_discount(db: AsyncSession, discount_id: uuid.UUID) -> Discount:
    result = await db.execute(select(Discount).where(Discount.id == discount_id))
    discount = result.scalar_one_or_none()
    if not discount:
        raise NotFoundError("Discount")
    return discount


async def update_discount(
    db: AsyncSession, discount_id: uuid.UUID, data: DiscountUpdate
) -> Discount:
    discount = await get_discount(db, discount_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(discount, field, value)
    await db.commit()
    await db.refresh(discount)
    return discount


async def delete_discount(db: AsyncSession, discount_id: uuid.UUID) -> None:
    discount = await get_discount(db, discount_id)
    discount.is_active = False
    await db.commit()
