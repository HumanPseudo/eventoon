"""add event_ai_insights table

Revision ID: a2b1c3d4e5f6
Revises: 14ee82cf3856
Create Date: 2026-06-14 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a2b1c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '14ee82cf3856'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('event_ai_insights',
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('event_name', sa.String(length=255), nullable=False),
        sa.Column('registration_count', sa.Integer(), nullable=False),
        sa.Column('max_capacity', sa.Integer(), nullable=False),
        sa.Column('summary', sa.String(length=2000), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False,
                  server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], ),
        sa.PrimaryKeyConstraint('event_id'),
    )


def downgrade() -> None:
    op.drop_table('event_ai_insights')
