from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import require_admin
from models.user import User
from schemas.store_settings import StoreSettingsOut, StoreSettingsUpdate
from services import store_settings as store_service

router = APIRouter(prefix="/store", tags=["store"])


@router.get("/config", response_model=StoreSettingsOut)
async def get_store_config(db: AsyncSession = Depends(get_db)):
    return await store_service.get_or_create(db)


@router.put("/config", response_model=StoreSettingsOut)
async def update_store_config(
    data: StoreSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await store_service.update(db, data)


@router.post("/banners/{index}/image", response_model=StoreSettingsOut)
async def upload_banner_image(
    index: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await store_service.upload_banner_image(db, index, file)


@router.post("/categories/{category}/image", response_model=StoreSettingsOut)
async def upload_category_image(
    category: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    return await store_service.upload_category_image(db, category, file)
