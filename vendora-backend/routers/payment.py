import json
import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.payment import CheckoutSessionOut, VerifyPaymentRequest, VerifyPaymentOut
from services import payment as payment_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/verify", response_model=VerifyPaymentOut)
async def verify_payment(
    data: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await payment_service.verify_payment(db, user.id, data)


@router.post("/retry/{order_id}", response_model=CheckoutSessionOut)
async def retry_payment(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await payment_service.retry_payment(db, user.id, order_id)


@router.post("/webhook")
async def webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    payload = json.loads(raw_body)
    await payment_service.handle_webhook(db, raw_body, signature, payload)
    return {}
