"""add store settings

Revision ID: j7f4a5b6c7d8
Revises: i6e3f4a5b6c7
Create Date: 2026-05-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

revision: str = 'j7f4a5b6c7d8'
down_revision: Union[str, None] = 'i6e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'store_settings',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('store_name', sa.Text, nullable=False, server_default='Vendora'),
        sa.Column('announcement_text', sa.Text, nullable=True),
        sa.Column('free_delivery_min', sa.Numeric(10, 2), nullable=False, server_default='499.00'),
        sa.Column('low_stock_threshold', sa.Integer, nullable=False, server_default='5'),
        sa.Column('hero_tagline', sa.Text, nullable=True),
        sa.Column('hero_description', sa.Text, nullable=True),
        sa.Column('trust_badges', pg.JSON, nullable=True),
        sa.Column('promo_banners', pg.JSON, nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('store_settings')
