import enum
import secrets
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship

from .database import Base


def gen_id() -> str:
    return uuid.uuid4().hex


def gen_invite_code() -> str:
    # 6 hex characters, e.g. "a1b2c3" - short enough to read over text/WhatsApp
    return secrets.token_hex(3)


def gen_secret() -> str:
    return secrets.token_hex(16)


class SplitType(str, enum.Enum):
    equal = "equal"
    exact = "exact"
    percentage = "percentage"


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
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    name = Column(String, nullable=False)
    secret = Column(String, default=gen_secret)  # this member's private device token
    color = Column(String, default="#B4863A")
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="members")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=gen_id)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(String, ForeignKey("members.id"), nullable=False)
    split_type = Column(SAEnum(SplitType), default=SplitType.equal)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="expenses")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(String, primary_key=True, default=gen_id)
    expense_id = Column(String, ForeignKey("expenses.id"), nullable=False)
    member_id = Column(String, ForeignKey("members.id"), nullable=False)
    share_amount = Column(Float, nullable=False)

    expense = relationship("Expense", back_populates="splits")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String, primary_key=True, default=gen_id)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    from_member = Column(String, ForeignKey("members.id"), nullable=False)
    to_member = Column(String, ForeignKey("members.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="settlements")
