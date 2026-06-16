"""add indexes on registrations table

Revision ID: b1c2d3e4f5g6
Revises: a3b4c5d6e7f8
Create Date: 2026-06-16 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5g6"
down_revision: Union[str, Sequence[str], None] = "a3b4c5d6e7f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_registration_event_id", "registrations", ["event_id"])
    op.create_index(
        "ix_registration_registration_date", "registrations", ["registration_date"]
    )


def downgrade() -> None:
    op.drop_index("ix_registration_registration_date")
    op.drop_index("ix_registration_event_id")
