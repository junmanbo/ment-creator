"""Merge all heads

Revision ID: 57c7e781ea1b
Revises: c3d4e5f6a7b8, e4f5a6b7c8d9
Create Date: 2025-06-05 21:36:45.512881

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '57c7e781ea1b'
down_revision: Union[str, None] = ('c3d4e5f6a7b8', 'e4f5a6b7c8d9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
