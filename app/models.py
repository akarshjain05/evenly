import enum
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Boolean, UniqueConstraint, String, Numeric, ForeignKey, DateTime, Enum as SAEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy import event

from .database import Base


def gen_id() -> str:
    return uuid.uuid4().hex


def gen_invite_code() -> str:
    # 10 hex characters, e.g. "a1b2c3" - short enough to read over text/WhatsApp
    return secrets.token_hex(5)


class SplitType(str, enum.Enum):
    equal = "equal"
    exact = "exact"
    percentage = "percentage"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    memberships = relationship("Member", back_populates="user")


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, index=True, default=gen_invite_code)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False, nullable=False)

    members = relationship("Member", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="group", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="group", cascade="all, delete-orphan")


class Member(Base):
    __tablename__ = "members"

    id = Column(String, primary_key=True, default=gen_id)
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#B4863A")
    is_admin = Column(Boolean, default=False)
    balance = Column(Numeric, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False, nullable=False)

    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint('group_id', 'user_id', name='uq_member_group_user'),
    )


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=gen_id)
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String, nullable=False)
    amount = Column(Numeric, nullable=False)
    paid_by = Column(String, ForeignKey("members.id", ondelete="CASCADE"), index=True, nullable=False)
    split_type = Column(SAEnum(SplitType), default=SplitType.equal)
    category = Column(String, default="General")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    created_by_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False, nullable=False)

    group = relationship("Group", back_populates="expenses")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_expenses_group_created', 'group_id', 'created_at', 'id'),
    )


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(String, primary_key=True, default=gen_id)
    expense_id = Column(String, ForeignKey("expenses.id", ondelete="CASCADE"), index=True, nullable=False)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), index=True, nullable=False)
    share_amount = Column(Numeric, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    expense = relationship("Expense", back_populates="splits")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String, primary_key=True, default=gen_id)
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    from_member = Column(String, ForeignKey("members.id", ondelete="CASCADE"), index=True, nullable=False)
    to_member = Column(String, ForeignKey("members.id", ondelete="CASCADE"), index=True, nullable=False)
    amount = Column(Numeric, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    created_by_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False, nullable=False)

    group = relationship("Group", back_populates="settlements")
    
    __table_args__ = (
        Index('ix_settlements_group_created', 'group_id', 'created_at', 'id'),
    )


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    endpoint = Column(String, nullable=False)
    p256dh = Column(String, nullable=False)
    auth = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint('user_id', 'endpoint', name='uq_push_sub_user_endpoint'),
    )

from sqlalchemy.orm import Session
@event.listens_for(Session, "before_flush")
def receive_before_flush(session, flush_context, instances):
    now = datetime.now(timezone.utc)
    for obj in session.dirty:
        if hasattr(obj, 'updated_at'):
            obj.updated_at = now
    for obj in session.new:
        if hasattr(obj, 'updated_at') and obj.updated_at is None:
            obj.updated_at = now
