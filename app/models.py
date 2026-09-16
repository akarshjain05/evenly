import enum
import secrets
import uuid
from datetime import datetime

from sqlalchemy import Column, Boolean, UniqueConstraint, String, Numeric, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship

from .database import Base


def gen_id() -> str:
    return uuid.uuid4().hex


def gen_invite_code() -> str:
    # 6 hex characters, e.g. "a1b2c3" - short enough to read over text/WhatsApp
    return secrets.token_hex(3)



class SplitType(str, enum.Enum):
    equal = "equal"
    exact = "exact"
    percentage = "percentage"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("Member", back_populates="user")


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, index=True, default=gen_invite_code)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("Member", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="group", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="group", cascade="all, delete-orphan")


class Member(Base):
    __tablename__ = "members"

    id = Column(String, primary_key=True, default=gen_id)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#B4863A")
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="memberships")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=gen_id)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False, index=True)
    description = Column(String, nullable=False)
    amount = Column(Numeric, nullable=False)
    paid_by = Column(String, ForeignKey("members.id"), index=True, nullable=False)
    split_type = Column(SAEnum(SplitType), default=SplitType.equal)
    category = Column(String, default="General")
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="expenses")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(String, primary_key=True, default=gen_id)
    expense_id = Column(String, ForeignKey("expenses.id"), index=True, nullable=False)
    member_id = Column(String, ForeignKey("members.id"), index=True, nullable=False)
    share_amount = Column(Numeric, nullable=False)

    expense = relationship("Expense", back_populates="splits")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String, primary_key=True, default=gen_id)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False, index=True)
    from_member = Column(String, ForeignKey("members.id"), index=True, nullable=False)
    to_member = Column(String, ForeignKey("members.id"), index=True, nullable=False)
    amount = Column(Numeric, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="settlements")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    endpoint = Column(String, nullable=False)
    p256dh = Column(String, nullable=False)
    auth = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

