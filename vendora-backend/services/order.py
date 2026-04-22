import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload

from config import settings
from exceptions import AppException, NotFoundError
from models.cart import CartItem
from models.discount import DiscountUsage
from models.order import Order, OrderItem
from models.product import Product
from models.product_variant import ProductVariant
from schemas.order import PlaceOrderRequest, OrderOut, OrderListOut, OrderSummaryOut, OrderItemOut, DeliveryAddress
from schemas.payment import CheckoutSessionOut
from services.discount import validate_discount
from services.payment import razorpay_client, _build_checkout_session


async def place_order(db: AsyncSession, user_id: uuid.UUID, data: PlaceOrderRequest) -> CheckoutSessionOut:
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(selectinload(CartItem.product), selectinload(CartItem.variant))
    )
    cart_items = result.scalars().all()

    if not cart_items:
        raise AppException(400, "Cart is empty")

    for item in cart_items:
        effective_stock = item.variant.stock if item.variant else item.product.stock
        if item.quantity > effective_stock:
            raise AppException(400, f"Insufficient stock for '{item.product.name}'")

    subtotal = sum(
        float(item.variant.price if item.variant else item.product.price) * item.quantity
        for item in cart_items
    )

    discount_amount = 0.0
    discount_id = None
    discount_code_used = None

    if data.discount_code:
        disc = await validate_discount(db, user_id, data.discount_code, subtotal)
        discount_amount = disc.applied_amount
        discount_id = disc.discount_id
        discount_code_used = disc.code

    final_amount = round(subtotal - discount_amount, 2)

    if settings.MIN_ORDER_AMOUNT > 0 and final_amount < settings.MIN_ORDER_AMOUNT:
        raise AppException(400, f"Minimum order amount is ₹{settings.MIN_ORDER_AMOUNT:.0f}")

    order = Order(
        buyer_id=user_id,
        delivery_address=data.delivery_address.model_dump(),
        subtotal=subtotal,
        discount_amount=discount_amount,
        discount_code=discount_code_used,
        discount_id=discount_id,
        total_amount=final_amount,
    )
    db.add(order)
    await db.flush()

    stock_changes = []
    for item in cart_items:
        unit_price = float(item.variant.price if item.variant else item.product.price)
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product.id,
            product_name=item.product.name,
            unit_price=unit_price,
            quantity=item.quantity,
            subtotal=unit_price * item.quantity,
            variant_id=item.variant_id,
            variant_label=item.variant.label if item.variant else None,
        ))
        if item.variant:
            stock_changes.append(('variant', item.variant_id, item.quantity))
            item.variant.stock -= item.quantity
        else:
            stock_changes.append(('product', item.product.id, item.quantity))
            item.product.stock -= item.quantity
        await db.delete(item)

    if discount_id:
        db.add(DiscountUsage(
            discount_id=discount_id,
            user_id=user_id,
            order_id=order.id,
            applied_amount=discount_amount,
        ))

    await db.commit()

    amount_paise = int(final_amount * 100)
    try:
        rzp_order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": str(order.id),
        })
    except Exception as e:
        import logging
        logging.error("Razorpay order.create failed: %s", e, exc_info=True)
        for kind, entity_id, quantity in stock_changes:
            if kind == 'variant':
                await db.execute(
                    update(ProductVariant)
                    .where(ProductVariant.id == entity_id)
                    .values(stock=ProductVariant.stock + quantity)
                )
            else:
                await db.execute(
                    update(Product)
                    .where(Product.id == entity_id)
                    .values(stock=Product.stock + quantity)
                )
        order.status = "expired"
        await db.commit()
        raise AppException(502, "Payment service unavailable — please try again")

    order.razorpay_order_id = rzp_order["id"]
    await db.commit()

    return _build_checkout_session(order, rzp_order["id"], amount_paise)


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
        subtotal=float(order.subtotal),
        discount_amount=float(order.discount_amount),
        discount_code=order.discount_code,
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
                variant_label=item.variant_label,
            )
            for item in order.items
        ],
    )


def _build_order_summary(order: Order) -> OrderSummaryOut:
    return OrderSummaryOut(
        id=order.id,
        status=order.status,
        subtotal=float(order.subtotal),
        discount_amount=float(order.discount_amount),
        discount_code=order.discount_code,
        total_amount=float(order.total_amount),
        delivery_address=DeliveryAddress(**order.delivery_address),
        created_at=order.created_at,
        item_count=len(order.items),
    )
