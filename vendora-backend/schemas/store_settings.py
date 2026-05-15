from datetime import datetime
from pydantic import BaseModel


class TrustBadge(BaseModel):
    icon: str
    text: str


class PromoBanner(BaseModel):
    subtitle: str
    title: str
    description: str
    category: str
    color: str  # "green" | "orange"
    image_url: str | None = None


class StoreSettingsOut(BaseModel):
    store_name: str
    announcement_text: str | None
    free_delivery_min: float
    low_stock_threshold: int
    hero_tagline: str | None
    hero_description: str | None
    trust_badges: list[TrustBadge] | None
    promo_banners: list[PromoBanner] | None
    category_images: dict[str, str] | None
    updated_at: datetime

    model_config = {"from_attributes": True}


class StoreSettingsUpdate(BaseModel):
    store_name: str | None = None
    announcement_text: str | None = None
    free_delivery_min: float | None = None
    low_stock_threshold: int | None = None
    hero_tagline: str | None = None
    hero_description: str | None = None
    trust_badges: list[TrustBadge] | None = None
    promo_banners: list[PromoBanner] | None = None
