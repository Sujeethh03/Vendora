import os
import uuid
import shutil

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from exceptions import AppException
from models.store_settings import StoreSettings
from schemas.store_settings import StoreSettingsUpdate

BANNER_UPLOAD_DIR = "uploads/banners"
CATEGORY_UPLOAD_DIR = "uploads/categories"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

_DEFAULT_TRUST_BADGES = [
    {"icon": "🌱", "text": "100% Farm Fresh"},
    {"icon": "🚚", "text": "Free Delivery above ₹499"},
    {"icon": "💳", "text": "COD & UPI Accepted"},
    {"icon": "🔒", "text": "Secure Checkout"},
    {"icon": "♻️", "text": "No Chemicals Added"},
]

_DEFAULT_PROMO_BANNERS = [
    {
        "subtitle": "Fresh Daily",
        "title": "Farm Vegetables",
        "description": "Picked this morning, at your door by evening.",
        "category": "vegetables",
        "color": "green",
    },
    {
        "subtitle": "Pantry Staples",
        "title": "Grains & Pulses",
        "description": "Stone-milled, unprocessed, pure nutrition.",
        "category": "grains",
        "color": "orange",
    },
]


async def get_or_create(db: AsyncSession) -> StoreSettings:
    result = await db.execute(select(StoreSettings).limit(1))
    settings = result.scalar_one_or_none()
    if settings:
        return settings

    settings = StoreSettings(
        store_name="Vendora",
        announcement_text="🌿 Fresh from the farm · Free delivery on orders above ₹499 · COD available",
        free_delivery_min=499.0,
        low_stock_threshold=5,
        hero_tagline="Pure. Natural. Straight from the Farm.",
        hero_description="Shop directly from local farmers. No middlemen, no chemicals — just honest, fresh produce delivered to your door.",
        trust_badges=_DEFAULT_TRUST_BADGES,
        promo_banners=_DEFAULT_PROMO_BANNERS,
    )
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    return settings


async def update(db: AsyncSession, data: StoreSettingsUpdate) -> StoreSettings:
    settings = await get_or_create(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
        if field == "promo_banners":
            flag_modified(settings, "promo_banners")
        if field == "trust_badges":
            flag_modified(settings, "trust_badges")
    await db.commit()
    await db.refresh(settings)
    return settings


async def upload_banner_image(db: AsyncSession, index: int, file: UploadFile) -> StoreSettings:
    if index < 0:
        raise AppException(400, "Invalid banner index")
    if file.content_type not in ALLOWED_TYPES:
        raise AppException(400, "Only JPEG, PNG, and WebP images are allowed")

    settings = await get_or_create(db)
    banners = list(settings.promo_banners or [])
    while len(banners) <= index:
        banners.append({})

    os.makedirs(BANNER_UPLOAD_DIR, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(BANNER_UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    banners[index] = {**banners[index], "image_url": f"/static/banners/{filename}"}
    settings.promo_banners = banners
    flag_modified(settings, "promo_banners")
    await db.commit()
    await db.refresh(settings)
    return settings


async def upload_category_image(db: AsyncSession, category: str, file: UploadFile) -> StoreSettings:
    if not category.strip():
        raise AppException(400, "Category name is required")
    if file.content_type not in ALLOWED_TYPES:
        raise AppException(400, "Only JPEG, PNG, and WebP images are allowed")

    settings = await get_or_create(db)
    images = dict(settings.category_images or {})

    os.makedirs(CATEGORY_UPLOAD_DIR, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(CATEGORY_UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    images[category.lower()] = f"/static/categories/{filename}"
    settings.category_images = images
    flag_modified(settings, "category_images")
    await db.commit()
    await db.refresh(settings)
    return settings
