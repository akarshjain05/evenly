from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    your_name: str = Field(..., min_length=1, max_length=40)

class GroupUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)



class JoinRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=40)


class SplitInput(BaseModel):
    member_id: str
    value: float  # exact: rupees/dollars; percentage: 0-100


class ExpenseCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=120)
    category: str = "General"
    amount: float = Field(..., gt=0)
    paid_by: str
    split_type: Literal["equal", "exact", "percentage"] = "equal"
    participant_ids: Optional[List[str]] = None  # used for "equal"
    splits: Optional[List[SplitInput]] = None  # used for "exact" / "percentage"


class SettlementCreate(BaseModel):
    from_member: str
    to_member: str
    amount: float = Field(..., gt=0)

class MemberResponse(BaseModel):
    id: str
    name: str
    color: str
    is_admin: bool = False

class GroupSummary(BaseModel):
    id: str
    name: str
    invite_code: str

class MembershipResponse(BaseModel):
    group: GroupSummary
    member: MemberResponse

class CreateJoinResponse(BaseModel):
    group: GroupSummary
    member: MemberResponse

class SimplifiedDebt(BaseModel):
    from_member: str
    to_member: str
    amount: float
    from_name: str
    to_name: str

class MemberBalances(MemberResponse):
    balance: float

class GroupDetailResponse(BaseModel):
    id: str
    name: str
    invite_code: str
    members: List[MemberBalances]
    simplified_debts: List[SimplifiedDebt]

class SplitInfo(BaseModel):
    member_id: str
    name: str
    share_amount: float

class ActivityResponse(BaseModel):
    id: str
    type: str
    category: Optional[str] = None
    description: str
    amount: float
    paid_by_name: str
    created_at: datetime
    from_name: Optional[str] = None
    to_name: Optional[str] = None
    from_member: Optional[str] = None
    to_member: Optional[str] = None
    paid_by: Optional[str] = None
    split_type: Optional[str] = None
    splits: Optional[List[SplitInfo]] = None

class BasicResponse(BaseModel):
    ok: bool

class ExpenseResponse(BasicResponse):
    expense_id: str
