"""order_item product_id nullable with SET NULL

Revision ID: d4f1a2b3c5e6
Revises: c26eb7f82c43
Create Date: 2026-03-26

"""
from alembic import op
import sqlalchemy as sa

revision = 'd4f1a2b3c5e6'
down_revision = 'c26eb7f82c43'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the old FK constraint
    op.drop_constraint('order_items_product_id_fkey', 'order_items', type_='foreignkey')

    # Make product_id nullable
    op.alter_column('order_items', 'product_id', nullable=True)

    # Re-add FK with SET NULL on delete
    op.create_foreign_key(
        'order_items_product_id_fkey',
        'order_items', 'products',
        ['product_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('order_items_product_id_fkey', 'order_items', type_='foreignkey')
    op.alter_column('order_items', 'product_id', nullable=False)
    op.create_foreign_key(
        'order_items_product_id_fkey',
        'order_items', 'products',
        ['product_id'], ['id']
    )
