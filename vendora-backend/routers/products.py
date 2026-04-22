import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import require_admin
from models.user import User
from schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductListOut, ProductImageOut
from schemas.product_variant import ProductVariantCreate, ProductVariantUpdate, ProductVariantOut
from services import product as product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListOut)
async def list_products(
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    products, total = await product_service.list_products(
        db, category, search, min_price, max_price, page, page_size
    )
    return ProductListOut(items=products, total=total, page=page, page_size=page_size)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await product_service.get_product(db, product_id)


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return await product_service.create_product(db, admin.id, data)


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await product_service.update_product(db, product_id, data)


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await product_service.delete_product(db, product_id)


@router.post("/{product_id}/images", response_model=ProductImageOut, status_code=201)
async def upload_product_image(
    product_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await product_service.upload_product_image(db, product_id, file)


@router.delete("/{product_id}/images/{image_id}", status_code=204)
async def delete_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await product_service.delete_product_image(db, product_id, image_id)


@router.patch("/{product_id}/images/{image_id}/primary", response_model=ProductImageOut)
async def set_primary_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await product_service.set_primary_image(db, product_id, image_id)


@router.post("/{product_id}/variants", response_model=ProductVariantOut, status_code=201)
async def create_variant(
    product_id: uuid.UUID,
    data: ProductVariantCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await product_service.create_variant(db, product_id, data)


@router.put("/{product_id}/variants/{variant_id}", response_model=ProductVariantOut)
async def update_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    data: ProductVariantUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await product_service.update_variant(db, product_id, variant_id, data)


@router.delete("/{product_id}/variants/{variant_id}", status_code=204)
async def delete_variant(
    product_id: uuid.UUID,
    variant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    await product_service.delete_variant(db, product_id, variant_id)
