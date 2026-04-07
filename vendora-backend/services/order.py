import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from exceptions import AppException, NotFoundError
from models.cart import CartItem
from models.order import Order, OrderItem
from models.product import Product
from schemas.order import PlaceOrderRequest, OrderOut, OrderListOut, OrderSummaryOut, OrderItemOut, DeliveryAddress


async def place_order(db: AsyncSession, user_id: uuid.UUID, data: PlaceOrderRequest) -> OrderOut:
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(selectinload(CartItem.product))
    )
    cart_items = result.scalars().all()

    if not cart_items:
        raise AppException(400, "Cart is empty")

    for item in cart_items:
        if item.quantity > item.product.stock:
            raise AppException(400, f"Insufficient stock for '{item.product.name}'")

    total_amount = sum(float(item.product.price) * item.quantity for item in cart_items)

    order = Order(
        buyer_id=user_id,
        status="confirmed",
        delivery_address=data.delivery_address.model_dump(),
        total_amount=total_amount,
    )
    db.add(order)
    await db.flush()

    for item in cart_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product.id,
            product_name=item.product.name,
            unit_price=float(item.product.price),
            quantity=item.quantity,
            subtotal=float(item.product.price) * item.quantity,
        ))
        item.product.stock -= item.quantity
        await db.delete(item)

    await db.commit()

    # Fresh query so selectin loads items
    order_result = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    order = order_result.scalar_one()
    return _build_order_out(order)


async def list_orders(
    db: AsyncSession, user_id: uuid.UUID, page: int = 1, page_size: int = 10
) -> OrderListOut:
    offset = (page - 1) * page_size

    total = (await db.execute(
        select(func.count(Order.id)).where(Order.buyer_id == user_id)
    )).scalar_one()

    result = await db.execute(
        select(Order)
        .where(Order.buyer_id == user_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    orders = result.scalars().all()

    return OrderListOut(
        items=[_build_order_summary(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_order(db: AsyncSession, user_id: uuid.UUID, order_id: uuid.UUID) -> OrderOut:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.buyer_id == user_id)
        .options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundError("Order")
    return _build_order_out(order)


def _build_order_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        status=order.status,
        total_amount=float(order.total_amount),
        delivery_address=DeliveryAddress(**order.delivery_address),
        created_at=order.created_at,
        items=[
            OrderItemOut(
                product_id=item.product_id,
                product_name=item.product_name,
                unit_price=float(item.unit_price),
                quantity=item.quantity,
                subtotal=float(item.subtotal),
            )
            for item in order.items
        ],
    )


def _build_order_summary(order: Order) -> OrderSummaryOut:
    return OrderSummaryOut(
        id=order.id,
        status=order.status,
        total_amount=float(order.total_amount),
        delivery_address=DeliveryAddress(**order.delivery_address),
        created_at=order.created_at,
        item_count=len(order.items),
    )
