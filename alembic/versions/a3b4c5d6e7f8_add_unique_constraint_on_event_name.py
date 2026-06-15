"""add unique constraint on event name

Revision ID: a3b4c5d6e7f8
Revises: a2b1c3d4e5f6
Create Date: 2026-06-15 01:55:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a3b4c5d6e7f8'
down_revision: Union[str, Sequence[str], None] = 'a2b1c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint('uq_event_name', 'events', ['name'])


def downgrade() -> None:
    op.drop_constraint('uq_event_name', 'events', type_='unique')
