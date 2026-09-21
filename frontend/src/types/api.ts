export interface UserCreate {
  email: string;
  name: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}


export interface GroupCreate {
  name: string;
  your_name: string;
}

export interface GroupUpdate {
  name: string;
}

export interface JoinRequest {
  name: string;
}

export interface SplitInput {
  member_id: string;
  value: number; // Decimal in backend
}

export interface ExpenseCreate {
  description: string;
  category?: string;
  amount: number;
  paid_by: string;
  split_type?: "equal" | "exact" | "percentage";
  participant_ids?: string[] | null;
  splits?: SplitInput[] | null;
}

export interface SettlementCreate {
  from_member: string;
  to_member: string;
  amount: number;
}

export interface MemberResponse {
  id: string;
  name: string;
  color: string;
  is_admin?: boolean;
  user_id?: string | null;
}

export interface GroupSummary {
  id: string;
  name: string;
  invite_code: string;
}

export interface MembershipResponse {
  group: GroupSummary;
  member: MemberResponse;
}

export interface CreateJoinResponse {
  group: GroupSummary;
  member: MemberResponse;
}

export interface SimplifiedDebt {
  from_member: string;
  to_member: string;
  amount: number;
  from_name: string;
  to_name: string;
}

export interface MemberBalances extends MemberResponse {
  balance: number;
}

export interface GroupDetailResponse {
  id: string;
  name: string;
  invite_code: string;
  members: MemberBalances[];
  simplified_debts: SimplifiedDebt[];
}

export interface SplitInfo {
  member_id: string;
  name: string;
  share_amount: number;
}

export interface ActivityResponse {
  id: string;
  type: string;
  category?: string | null;
  description: string;
  amount: number;
  paid_by_name: string;
  created_at: string;
  from_name?: string | null;
  to_name?: string | null;
  from_member?: string | null;
  to_member?: string | null;
  paid_by?: string | null;
  split_type?: string | null;
  splits?: SplitInfo[] | null;
}

export interface BasicResponse {
  ok: boolean;
}

export interface ExpenseResponse extends BasicResponse {
  expense_id: string;
}

export interface PushSubscriptionCreate {
  endpoint: string;
  p256dh: string;
  auth: string;
}
