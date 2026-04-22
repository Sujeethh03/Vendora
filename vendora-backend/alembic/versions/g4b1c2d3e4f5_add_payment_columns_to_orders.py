"""add payment columns to orders

Revision ID: g4b1c2d3e4f5
Revises: f3a1b2c4d5e6
Create Date: 2026-04-21 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'g4b1c2d3e4f5'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('razorpay_order_id', sa.String(64), nullable=True, unique=True))
    op.add_column('orders', sa.Column('razorpay_payment_id', sa.String(64), nullable=True))
    op.add_column('orders', sa.Column('razorpay_signature', sa.String(128), nullable=True))
    op.add_column('orders', sa.Column('payment_failed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column(
        'expires_at',
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("now() + interval '30 minutes'"),
    ))
    op.alter_column('orders', 'status', server_default='pending_payment')
    op.create_index('ix_orders_razorpay_order_id', 'orders', ['razorpay_order_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_orders_razorpay_order_id', table_name='orders')
    op.alter_column('orders', 'status', server_default='confirmed')
    op.drop_column('orders', 'expires_at')
    op.drop_column('orders', 'paid_at')
    op.drop_column('orders', 'payment_failed_at')
    op.drop_column('orders', 'razorpay_signature')
    op.drop_column('orders', 'razorpay_payment_id')
    op.drop_column('orders', 'razorpay_order_id')
