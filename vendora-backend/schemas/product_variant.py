import uuid
from pydantic import BaseModel


class ProductVariantCreate(BaseModel):
    label: str
    price: float
    stock: int = 0


class ProductVariantUpdate(BaseModel):
    label: str | None = None
    price: float | None = None
    stock: int | None = None


class ProductVariantOut(BaseModel):
    id: uuid.UUID
    label: str
    price: float
    stock: int

    model_config = {"from_attributes": True}
