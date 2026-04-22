import hmac
import hashlib
import json
import uuid
from datetime import datetime, timezone, timedelta

import razorpay
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from config import settings
from exceptions import AppException, NotFoundError
from models.order import Order
from models.product import Product
from schemas.payment import CheckoutSessionOut, VerifyPaymentRequest, VerifyPaymentOut

razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _build_checkout_session(order: Order, razorpay_order_id: str, amount_paise: int) -> CheckoutSessionOut:
    return CheckoutSessionOut(
        order_id=order.id,
        razorpay_order_id=razorpay_order_id,
        amount=amount_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID,
        name="Vendora",
        description=f"Order #{str(order.id)[:8].upper()}",
    )


async def verify_payment(
    db: AsyncSession, user_id: uuid.UUID, data: VerifyPaymentRequest
) -> VerifyPaymentOut:
    result = await db.execute(
        select(Order)
        .where(Order.id == data.order_id, Order.buyer_id == user_id)
        .with_for_update()
    )
    order = result.scalar_one_or_none()

    if not order:
        raise NotFoundError("Order")

    if order.status != "pending_payment":
        if order.status == "confirmed":
            raise AppException(400, "Order already confirmed")
        raise AppException(400, "Order is not awaiting payment")

    if order.razorpay_order_id != data.razorpay_order_id:
        raise AppException(400, "Stale payment session — please retry")

    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, data.razorpay_signature):
        raise AppException(400, "Invalid payment signature")

    rzp_payment = razorpay_client.payment.fetch(data.razorpay_payment_id)
    expected_paise = int(float(order.total_amount) * 100)

    if rzp_payment["amount"] != expected_paise or rzp_payment["status"] != "captured":
        raise AppException(400, "Payment amount mismatch or not captured")

    order.status = "confirmed"
    order.razorpay_payment_id = data.razorpay_payment_id
    order.razorpay_signature = data.razorpay_signature
    order.paid_at = datetime.now(timezone.utc)
    await db.commit()

    return VerifyPaymentOut(order_id=order.id)


async def retry_payment(
    db: AsyncSession, user_id: uuid.UUID, order_id: uuid.UUID
) -> CheckoutSessionOut:
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.buyer_id == user_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise NotFoundError("Order")

    if order.status == "expired":
        raise AppException(400, "This payment link has expired")

    if order.status != "pending_payment":
        raise AppException(400, "Order is not awaiting payment")

    amount_paise = int(float(order.total_amount) * 100)
    rzp_order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": str(order.id),
    })

    order.razorpay_order_id = rzp_order["id"]
    order.payment_failed_at = None
    order.expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    await db.commit()

    return _build_checkout_session(order, rzp_order["id"], amount_paise)


async def handle_webhook(
    db: AsyncSession, raw_body: bytes, signature: str, payload: dict
) -> None:
    if not signature:
        raise AppException(400, "Missing webhook signature")

    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        raise AppException(400, "Invalid webhook signature")

    event = payload.get("event")
    if event not in ("payment.captured", "payment.failed"):
        return

    rzp_order_id = payload["payload"]["payment"]["entity"]["order_id"]

    result = await db.execute(
        select(Order)
        .where(Order.razorpay_order_id == rzp_order_id)
        .with_for_update()
    )
    order = result.scalar_one_or_none()

    if not order or order.status != "pending_payment":
        return

    if event == "payment.captured":
        order.status = "confirmed"
        order.razorpay_payment_id = payload["payload"]["payment"]["entity"]["id"]
        order.paid_at = datetime.now(timezone.utc)
    elif event == "payment.failed":
        order.payment_failed_at = datetime.now(timezone.utc)

    await db.commit()
