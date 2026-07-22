"""add preferences to users

Revision ID: a1b2c3d4e5f6
Revises: f1a2b3c4d5e6
Create Date: 2025-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('preferences', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('users', 'preferences')
