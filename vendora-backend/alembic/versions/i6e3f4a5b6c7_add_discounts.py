"""add discounts

Revision ID: i6e3f4a5b6c7
Revises: h5d2e3f4a5b6
Create Date: 2026-04-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

revision: str = 'i6e3f4a5b6c7'
down_revision: Union[str, None] = 'h5d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'discounts',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('discount_type', sa.String(20), nullable=False),
        sa.Column('value', sa.Numeric(14, 2), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('min_order_amount', sa.Numeric(14, 2), nullable=True),
        sa.Column('max_uses', sa.Integer, nullable=True),
        sa.Column('max_uses_per_user', sa.Integer, nullable=False, server_default='1'),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_discounts_code', 'discounts', ['code'])

    op.create_table(
        'discount_usages',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('discount_id', pg.UUID(as_uuid=True),
                  sa.ForeignKey('discounts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', pg.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_id', pg.UUID(as_uuid=True),
                  sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('applied_amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('discount_id', 'order_id', name='uq_discount_usage_order'),
    )

    op.add_column('orders', sa.Column('subtotal', sa.Numeric(14, 2), nullable=True))
    op.add_column('orders', sa.Column('discount_amount', sa.Numeric(14, 2), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('discount_code', sa.String(50), nullable=True))
    op.add_column('orders', sa.Column('discount_id', pg.UUID(as_uuid=True),
                  sa.ForeignKey('discounts.id', ondelete='SET NULL'), nullable=True))

    op.execute('UPDATE orders SET subtotal = total_amount WHERE subtotal IS NULL')
    op.alter_column('orders', 'subtotal', nullable=False)


def downgrade() -> None:
    op.drop_column('orders', 'discount_id')
    op.drop_column('orders', 'discount_code')
    op.drop_column('orders', 'discount_amount')
    op.drop_column('orders', 'subtotal')
    op.drop_table('discount_usages')
    op.drop_index('idx_discounts_code', table_name='discounts')
    op.drop_table('discounts')
