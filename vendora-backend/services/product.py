import uuid
import os
import shutil

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from exceptions import NotFoundError, AppException
from models.product import Product, ProductImage
from schemas.product import ProductCreate, ProductUpdate

MAX_IMAGES_PER_PRODUCT = 5
UPLOAD_DIR = "uploads/products"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def create_product(db: AsyncSession, admin_id: uuid.UUID, data: ProductCreate) -> Product:
    product = Product(seller_id=admin_id, **data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product, ["images"])
    return product


async def update_product(
    db: AsyncSession, product_id: uuid.UUID, data: ProductUpdate
) -> Product:
    product = await _get_active_product(db, product_id)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product, ["images"])
    return product


async def delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    product = await _get_active_product(db, product_id)
    # Delete image files from disk
    result = await db.execute(select(ProductImage).where(ProductImage.product_id == product_id))
    images = result.scalars().all()
    for image in images:
        _delete_file(image.url)
    await db.delete(product)
    await db.commit()


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    return await _get_active_product(db, product_id)


async def list_products(
    db: AsyncSession,
    category: str | None = None,
    search: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Product], int]:
    query = select(Product).options(selectinload(Product.images))

    if category:
        query = query.where(Product.category == category)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    products = result.scalars().all()

    return list(products), total


async def upload_product_image(
    db: AsyncSession, product_id: uuid.UUID, file: UploadFile
) -> ProductImage:
    await _get_active_product(db, product_id)

    if file.content_type not in ALLOWED_TYPES:
        raise AppException(400, "Only JPEG, PNG, and WebP images are allowed")

    count_result = await db.execute(
        select(func.count()).where(ProductImage.product_id == product_id)
    )
    count = count_result.scalar()
    if count >= MAX_IMAGES_PER_PRODUCT:
        raise AppException(400, f"Maximum {MAX_IMAGES_PER_PRODUCT} images allowed per product")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    is_primary = count == 0
    image = ProductImage(
        product_id=product_id,
        url=f"/static/products/{filename}",
        is_primary=is_primary,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


async def delete_product_image(
    db: AsyncSession, product_id: uuid.UUID, image_id: uuid.UUID
) -> None:
    await _get_active_product(db, product_id)

    result = await db.execute(
        select(ProductImage).where(ProductImage.id == image_id, ProductImage.product_id == product_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise NotFoundError("Image")

    was_primary = image.is_primary
    _delete_file(image.url)
    await db.delete(image)
    await db.flush()

    # If deleted image was primary, promote the next available image
    if was_primary:
        next_result = await db.execute(
            select(ProductImage).where(ProductImage.product_id == product_id).limit(1)
        )
        next_image = next_result.scalar_one_or_none()
        if next_image:
            next_image.is_primary = True

    await db.commit()


async def set_primary_image(
    db: AsyncSession, product_id: uuid.UUID, image_id: uuid.UUID
) -> ProductImage:
    await _get_active_product(db, product_id)

    # Clear existing primary
    all_result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product_id)
    )
    for img in all_result.scalars().all():
        img.is_primary = False

    # Set new primary
    target_result = await db.execute(
        select(ProductImage).where(ProductImage.id == image_id, ProductImage.product_id == product_id)
    )
    target = target_result.scalar_one_or_none()
    if not target:
        raise NotFoundError("Image")

    target.is_primary = True
    await db.commit()
    await db.refresh(target)
    return target


async def _get_active_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.images))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product")
    return product


def _delete_file(url: str) -> None:
    # url is like /static/products/filename.jpg
    relative = url.lstrip("/static/")
    path = os.path.join("uploads", relative)
    if os.path.exists(path):
        os.remove(path)
