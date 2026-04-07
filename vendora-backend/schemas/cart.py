import uuid
from pydantic import BaseModel, field_validator


class AddToCartRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_nonzero(cls, v: int) -> int:
        if v == 0:
            raise ValueError("quantity must not be zero")
        return v


class CartItemOut(BaseModel):
    product_id: uuid.UUID
    product_name: str
    product_image: str | None
    price: float
    quantity: int
    subtotal: float


class CartOut(BaseModel):
    items: list[CartItemOut]
    total_items: int
    total_amount: float
