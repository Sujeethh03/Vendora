import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductListOut, ProductImageOut
from services import product as product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListOut)
async def list_products(
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    seller_id: uuid.UUID | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    products, total = await product_service.list_products(
        db, category, search, min_price, max_price, seller_id, page, page_size
    )
    return ProductListOut(items=products, total=total, page=page, page_size=page_size)


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await product_service.get_product(db, product_id)


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await product_service.create_product(db, current_user.id, data)


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await product_service.update_product(db, product_id, current_user.id, data)


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await product_service.delete_product(db, product_id, current_user.id)


@router.post("/{product_id}/images", response_model=ProductImageOut, status_code=201)
async def upload_product_image(
    product_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await product_service.upload_product_image(db, product_id, current_user.id, file)


@router.delete("/{product_id}/images/{image_id}", status_code=204)
async def delete_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await product_service.delete_product_image(db, product_id, image_id, current_user.id)


@router.patch("/{product_id}/images/{image_id}/primary", response_model=ProductImageOut)
async def set_primary_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await product_service.set_primary_image(db, product_id, image_id, current_user.id)
