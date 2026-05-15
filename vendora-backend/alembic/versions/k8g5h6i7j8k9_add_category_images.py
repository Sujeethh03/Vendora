"""add category_images to store_settings

Revision ID: k8g5h6i7j8k9
Revises: j7f4a5b6c7d8
Create Date: 2026-05-15
"""
from alembic import op
import sqlalchemy as sa

revision = "k8g5h6i7j8k9"
down_revision = "j7f4a5b6c7d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("store_settings", sa.Column("category_images", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("store_settings", "category_images")
