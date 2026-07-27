"""merge multiple heads

Revision ID: 36f014bcb25f
Revises: c3d4e5f6a7b8, f7e8d9c0b1a2
Create Date: 2026-07-24 21:19:13.699855

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '36f014bcb25f'
down_revision: Union[str, Sequence[str], None] = ('c3d4e5f6a7b8', 'f7e8d9c0b1a2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
