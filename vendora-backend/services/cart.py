import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from exceptions import NotFoundError, AppException
from models.cart import CartItem
from models.product import Product
from schemas.cart import CartOut, CartItemOut


async def get_cart(db: AsyncSession, user_id: uuid.UUID) -> CartOut:
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(selectinload(CartItem.product).selectinload(Product.images))
    )
    items = result.scalars().all()
    return _build_cart_out(items)


async def add_to_cart(
    db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID, quantity: int
) -> CartOut:
    product_result = await db.execute(select(Product).where(Product.id == product_id))
    product = product_result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product")
    if product.stock == 0:
        raise AppException(400, "Product is out of stock")

    item_result = await db.execute(
        select(CartItem).where(CartItem.user_id == user_id, CartItem.product_id == product_id)
    )
    item = item_result.scalar_one_or_none()

    new_qty = (item.quantity if item else 0) + quantity

    if new_qty <= 0:
        if item:
            await db.delete(item)
    else:
        if new_qty > product.stock:
            raise AppException(400, f"Only {product.stock} units available in stock")
        if item:
            item.quantity = new_qty
        else:
            db.add(CartItem(user_id=user_id, product_id=product_id, quantity=new_qty))

    await db.commit()
    return await get_cart(db, user_id)


async def remove_from_cart(
    db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == user_id, CartItem.product_id == product_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Cart item")
    await db.delete(item)
    await db.commit()


async def clear_cart(db: AsyncSession, user_id: uuid.UUID) -> None:
    result = await db.execute(select(CartItem).where(CartItem.user_id == user_id))
    for item in result.scalars().all():
        await db.delete(item)
    await db.commit()


def _build_cart_out(items: list[CartItem]) -> CartOut:
    cart_items = []
    for item in items:
        product = item.product
        primary = next((img for img in product.images if img.is_primary), None) or (
            product.images[0] if product.images else None
        )
        cart_items.append(
            CartItemOut(
                product_id=product.id,
                product_name=product.name,
                product_image=primary.url if primary else None,
                price=float(product.price),
                quantity=item.quantity,
                subtotal=float(product.price) * item.quantity,
            )
        )
    return CartOut(
        items=cart_items,
        total_items=sum(i.quantity for i in cart_items),
        total_amount=sum(i.subtotal for i in cart_items),
    )
