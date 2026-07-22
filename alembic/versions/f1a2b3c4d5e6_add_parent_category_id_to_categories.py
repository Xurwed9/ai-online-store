"""add parent_category_id to categories

Revision ID: f1a2b3c4d5e6
Revises: 20d327590ef2
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = '20d327590ef2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'categories',
        sa.Column('parent_category_id', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        'fk_categories_parent',
        'categories',
        'categories',
        ['parent_category_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_categories_parent', 'categories', type_='foreignkey')
    op.drop_column('categories', 'parent_category_id')
