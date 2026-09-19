"""Add composite indexes for activity feed pagination

Revision ID: 211a28590e66
Revises: dbf9f5f93a7e
Create Date: 2026-09-19 10:23:07.142119

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '211a28590e66'
down_revision: Union[str, Sequence[str], None] = 'dbf9f5f93a7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index('ix_expenses_group_created', 'expenses', ['group_id', 'created_at'])
    op.create_index('ix_settlements_group_created', 'settlements', ['group_id', 'created_at'])



def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_settlements_group_created', table_name='settlements')
    op.drop_index('ix_expenses_group_created', table_name='expenses')

