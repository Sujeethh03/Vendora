import uuid
from datetime import datetime, timezone

from sqlalchemy import Text, Numeric, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


def now_utc():
    return datetime.now(timezone.utc)


class StoreSettings(Base):
    __tablename__ = "store_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_name: Mapped[str] = mapped_column(Text, nullable=False, default="Vendora")
    announcement_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    free_delivery_min: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=499.0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    hero_tagline: Mapped[str | None] = mapped_column(Text, nullable=True)
    hero_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    trust_badges: Mapped[list | None] = mapped_column(JSON, nullable=True)
    promo_banners: Mapped[list | None] = mapped_column(JSON, nullable=True)
    category_images: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
