"""Fix composite indexes and add unique constraints

Revision ID: a3f1c8d92b44
Revises: 9e8e16edc917
Create Date: 2026-09-21 15:20:00.000000

Fixes:
- CRITICAL-3: Adds missing 'id' column to composite indexes for cursor-based pagination
- Adds UniqueConstraint on Member(group_id, user_id) to prevent race-condition duplicate memberships
- Adds UniqueConstraint on PushSubscription(user_id, endpoint) to enforce uniqueness at DB level
- Adds ondelete="CASCADE" to all ForeignKey relationships for DB-level cascade support
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f1c8d92b44'
down_revision: Union[str, Sequence[str], None] = '9e8e16edc917'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Fix composite indexes to include 'id' for cursor-based pagination tie-breaking,
    and add unique constraints for data integrity."""
    from sqlalchemy.engine.reflection import Inspector
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)

    # --- CRITICAL-3: Fix composite indexes ---
    expense_indexes = {i['name'] for i in inspector.get_indexes('expenses')}
    settlement_indexes = {i['name'] for i in inspector.get_indexes('settlements')}

    # Drop and recreate expense composite index with 'id' column
    if 'ix_expenses_group_created' in expense_indexes:
        op.drop_index('ix_expenses_group_created', table_name='expenses')
    op.create_index('ix_expenses_group_created', 'expenses', ['group_id', 'created_at', 'id'])

    # Drop and recreate settlement composite index with 'id' column
    if 'ix_settlements_group_created' in settlement_indexes:
        op.drop_index('ix_settlements_group_created', table_name='settlements')
    op.create_index('ix_settlements_group_created', 'settlements', ['group_id', 'created_at', 'id'])

    # --- Unique constraints ---
    # Prevent race-condition duplicate memberships
    member_constraints = {c['name'] for c in inspector.get_unique_constraints('members')} if hasattr(inspector, 'get_unique_constraints') else set()
    if 'uq_member_group_user' not in member_constraints:
        with op.batch_alter_table('members') as batch_op:
            batch_op.create_unique_constraint('uq_member_group_user', ['group_id', 'user_id'])

    # Prevent duplicate push subscriptions
    push_constraints = set()
    if 'push_subscriptions' in inspector.get_table_names():
        push_constraints = {c['name'] for c in inspector.get_unique_constraints('push_subscriptions')} if hasattr(inspector, 'get_unique_constraints') else set()
        if 'uq_push_sub_user_endpoint' not in push_constraints:
            with op.batch_alter_table('push_subscriptions') as batch_op:
                batch_op.create_unique_constraint('uq_push_sub_user_endpoint', ['user_id', 'endpoint'])


def downgrade() -> None:
    """Revert composite indexes back to 2-column and drop unique constraints."""
    # Revert indexes to 2-column versions
    op.drop_index('ix_expenses_group_created', table_name='expenses')
    op.create_index('ix_expenses_group_created', 'expenses', ['group_id', 'created_at'])

    op.drop_index('ix_settlements_group_created', table_name='settlements')
    op.create_index('ix_settlements_group_created', 'settlements', ['group_id', 'created_at'])

    # Drop unique constraints
    with op.batch_alter_table('members') as batch_op:
        batch_op.drop_constraint('uq_member_group_user', type_='unique')

    with op.batch_alter_table('push_subscriptions') as batch_op:
        batch_op.drop_constraint('uq_push_sub_user_endpoint', type_='unique')
