import uuid

from pydantic import BaseModel


class CheckoutSessionOut(BaseModel):
    order_id: uuid.UUID
    razorpay_order_id: str
    amount: int
    currency: str
    key_id: str
    name: str
    description: str


class VerifyPaymentRequest(BaseModel):
    order_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifyPaymentOut(BaseModel):
    order_id: uuid.UUID
