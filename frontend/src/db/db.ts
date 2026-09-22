import Dexie from 'dexie';
import type { Table } from 'dexie';

// Local DB types (mirrors backend models)
export interface LocalGroup {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  created_by_user_id?: string | null;
}

export interface LocalMember {
  id: string;
  group_id: string;
  user_id: string | null;
  name: string;
  color: string;
  is_admin: boolean;
  balance: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  created_by_user_id?: string | null;
}

export interface LocalExpense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type: string;
  category: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  created_by_user_id: string | null;
}

export interface LocalExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  share_amount: number;
  updated_at: string;
}

export interface LocalSettlement {
  id: string;
  group_id: string;
  from_member: string;
  to_member: string;
  amount: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  created_by_user_id: string | null;
}

export interface PendingChange {
  id?: number; // auto-incremented
  table: string;
  action: 'create' | 'update' | 'delete';
  entity_id: string;
  group_id: string;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface SyncMeta {
  key: string;
  value: string;
}

class EvenlyDB extends Dexie {
  groups!: Table<LocalGroup, string>;
  members!: Table<LocalMember, string>;
  expenses!: Table<LocalExpense, string>;
  expenseSplits!: Table<LocalExpenseSplit, string>;
  settlements!: Table<LocalSettlement, string>;
  pendingChanges!: Table<PendingChange, number>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super('evenly');
    this.version(1).stores({
      groups: 'id, updated_at',
      members: 'id, group_id, user_id, updated_at',
      expenses: 'id, group_id, created_at, updated_at',
      expenseSplits: 'id, expense_id',
      settlements: 'id, group_id, created_at, updated_at',
      pendingChanges: '++id, table, entity_id',
      syncMeta: 'key'
    });
  }
}

export const db = new EvenlyDB();
