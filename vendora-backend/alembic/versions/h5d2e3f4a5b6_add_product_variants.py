"""add product variants

Revision ID: h5d2e3f4a5b6
Revises: g4b1c2d3e4f5
Create Date: 2026-04-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

revision: str = 'h5d2e3f4a5b6'
down_revision: Union[str, None] = 'g4b1c2d3e4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'product_variants',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('product_id', pg.UUID(as_uuid=True),
                  sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=False),
        sa.Column('label', sa.Text, nullable=False),
        sa.Column('price', sa.Numeric(14, 2), nullable=False),
        sa.Column('stock', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )

    op.add_column('cart_items', sa.Column(
        'variant_id', pg.UUID(as_uuid=True),
        sa.ForeignKey('product_variants.id', ondelete='SET NULL'),
        nullable=True,
    ))

    op.drop_constraint('uq_cart_user_product', 'cart_items', type_='unique')

    op.create_index(
        'uq_cart_no_variant', 'cart_items',
        ['user_id', 'product_id'], unique=True,
        postgresql_where=sa.text('variant_id IS NULL'),
    )
    op.create_index(
        'uq_cart_with_variant', 'cart_items',
        ['user_id', 'product_id', 'variant_id'], unique=True,
        postgresql_where=sa.text('variant_id IS NOT NULL'),
    )

    op.add_column('order_items', sa.Column('variant_id', pg.UUID(as_uuid=True), nullable=True))
    op.add_column('order_items', sa.Column('variant_label', sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column('order_items', 'variant_label')
    op.drop_column('order_items', 'variant_id')

    op.drop_index('uq_cart_with_variant', table_name='cart_items')
    op.drop_index('uq_cart_no_variant', table_name='cart_items')
    op.drop_column('cart_items', 'variant_id')
    op.create_unique_constraint('uq_cart_user_product', 'cart_items', ['user_id', 'product_id'])

    op.drop_table('product_variants')
