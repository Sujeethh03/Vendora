from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import AsyncSessionLocal
from models.order import Order
from models.product import Product


async def expire_pending_orders(db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Order)
        .where(
            Order.status == "pending_payment",
            Order.expires_at < now,
        )
        .options(selectinload(Order.items))
        .with_for_update(skip_locked=True)
    )
    orders = result.scalars().all()

    for order in orders:
        for item in order.items:
            if item.product_id is not None:
                await db.execute(
                    update(Product)
                    .where(Product.id == item.product_id)
                    .values(stock=Product.stock + item.quantity)
                )
        order.status = "expired"

    await db.commit()


async def expire_pending_orders_task() -> None:
    async with AsyncSessionLocal() as db:
        await expire_pending_orders(db)
