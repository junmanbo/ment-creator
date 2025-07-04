"""merge heads

Revision ID: 98a64ae4170c
Revises: 0cc81e9f6eb0, ca1de7c09d1e
Create Date: 2025-07-04 12:22:10.155709

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98a64ae4170c'
down_revision: Union[str, None] = ('0cc81e9f6eb0', 'ca1de7c09d1e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
