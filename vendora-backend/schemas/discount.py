import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, field_validator


class DiscountCreate(BaseModel):
    code: str
    discount_type: Literal["percentage", "fixed_amount"]
    value: float
    description: Optional[str] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    max_uses_per_user: int = 1
    valid_from: datetime
    valid_until: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def code_upper(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("value")
    @classmethod
    def value_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("value must be positive")
        return v


class DiscountUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[Literal["percentage", "fixed_amount"]] = None
    value: Optional[float] = None
    description: Optional[str] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def code_upper(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().upper() if v else v


class DiscountOut(BaseModel):
    id: uuid.UUID
    code: str
    discount_type: str
    value: float
    description: Optional[str]
    min_order_amount: Optional[float]
    max_uses: Optional[int]
    max_uses_per_user: int
    valid_from: datetime
    valid_until: Optional[datetime]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ValidateDiscountRequest(BaseModel):
    code: str
    subtotal: float


class ValidateDiscountOut(BaseModel):
    discount_id: uuid.UUID
    code: str
    discount_type: str
    value: float
    applied_amount: float
    final_amount: float
