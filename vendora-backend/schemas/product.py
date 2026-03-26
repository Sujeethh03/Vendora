import uuid
from datetime import datetime
from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    stock: int
    category: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    category: str | None = None


class ProductImageOut(BaseModel):
    id: uuid.UUID
    url: str
    is_primary: bool

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    name: str
    description: str | None
    price: float
    stock: int
    category: str | None
    status: str
    created_at: datetime
    images: list[ProductImageOut] = []

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
