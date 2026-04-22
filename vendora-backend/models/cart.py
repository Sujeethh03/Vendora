import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def now_utc():
    return datetime.now(timezone.utc)


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        Index(
            "uq_cart_no_variant", "user_id", "product_id",
            unique=True, postgresql_where="variant_id IS NULL",
        ),
        Index(
            "uq_cart_with_variant", "user_id", "product_id", "variant_id",
            unique=True, postgresql_where="variant_id IS NOT NULL",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    product: Mapped["Product"] = relationship("Product", lazy="selectin")  # type: ignore[name-defined]
    variant: Mapped["ProductVariant | None"] = relationship("ProductVariant", lazy="selectin")  # type: ignore[name-defined]
