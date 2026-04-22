import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DeliveryAddress(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    pincode: str


class PlaceOrderRequest(BaseModel):
    delivery_address: DeliveryAddress
    discount_code: Optional[str] = None


class OrderItemOut(BaseModel):
    product_id: Optional[uuid.UUID]
    product_name: str
    unit_price: float
    quantity: int
    subtotal: float
    variant_label: Optional[str] = None


class OrderOut(BaseModel):
    id: uuid.UUID
    status: str
    subtotal: float
    discount_amount: float
    discount_code: Optional[str]
    total_amount: float
    delivery_address: DeliveryAddress
    created_at: datetime
    items: list[OrderItemOut]


class OrderSummaryOut(BaseModel):
    id: uuid.UUID
    status: str
    subtotal: float
    discount_amount: float
    discount_code: Optional[str]
    total_amount: float
    delivery_address: DeliveryAddress
    created_at: datetime
    item_count: int


class OrderListOut(BaseModel):
    items: list[OrderSummaryOut]
    total: int
    page: int
    page_size: int
