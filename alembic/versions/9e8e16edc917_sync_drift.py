"""sync_drift

Revision ID: 9e8e16edc917
Revises: 211a28590e66
Create Date: 2026-09-19 16:57:16.592049

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e8e16edc917'
down_revision: Union[str, Sequence[str], None] = '211a28590e66'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from sqlalchemy.engine.reflection import Inspector
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    
    expense_cols = [c['name'] for c in inspector.get_columns('expenses')]
    settlement_cols = [c['name'] for c in inspector.get_columns('settlements')]
    user_cols = [c['name'] for c in inspector.get_columns('users')]
    expense_indexes = [i['name'] for i in inspector.get_indexes('expenses')]
    settlement_indexes = [i['name'] for i in inspector.get_indexes('settlements')]
    
    with op.batch_alter_table('expenses') as batch_op:
        if 'created_by_user_id' not in expense_cols:
            batch_op.add_column(sa.Column('created_by_user_id', sa.String(), nullable=True))
            batch_op.create_foreign_key('fk_expenses_created_by', 'users', ['created_by_user_id'], ['id'])
        if 'ix_expenses_created_at' not in expense_indexes:
            batch_op.create_index(batch_op.f('ix_expenses_created_at'), ['created_at'], unique=False)
        if 'ix_expenses_created_by_user_id' not in expense_indexes:
            batch_op.create_index(batch_op.f('ix_expenses_created_by_user_id'), ['created_by_user_id'], unique=False)
            
    with op.batch_alter_table('settlements') as batch_op:
        if 'created_by_user_id' not in settlement_cols:
            batch_op.add_column(sa.Column('created_by_user_id', sa.String(), nullable=True))
            batch_op.create_foreign_key('fk_settlements_created_by', 'users', ['created_by_user_id'], ['id'])
        if 'ix_settlements_created_at' not in settlement_indexes:
            batch_op.create_index(batch_op.f('ix_settlements_created_at'), ['created_at'], unique=False)
        if 'ix_settlements_created_by_user_id' not in settlement_indexes:
            batch_op.create_index(batch_op.f('ix_settlements_created_by_user_id'), ['created_by_user_id'], unique=False)
            
    with op.batch_alter_table('users') as batch_op:
        if 'name' not in user_cols:
            batch_op.add_column(sa.Column('name', sa.String(), nullable=True))
            
    if 'name' not in user_cols:
        op.execute("UPDATE users SET name = 'Unknown' WHERE name IS NULL")

def downgrade() -> None:
    """Downgrade schema."""

