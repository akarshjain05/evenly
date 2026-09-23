import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { simplifyDebts } from '../utils/balances';
import type { MembershipResponse, GroupDetailResponse, ActivityResponse } from '../types/api';

export function useLocalGroups(userId: string | undefined): MembershipResponse[] | undefined {
  return useLiveQuery(async () => {
    if (!userId) return [];
    
    // Get all user memberships that are not deleted
    const userMemberships = await db.members
      .filter(m => m.user_id === userId && m.is_deleted !== true)
      .toArray();

    const memberships: MembershipResponse[] = [];
    
    for (const member of userMemberships) {
      const group = await db.groups.get(member.group_id);
      if (group && !group.is_deleted === true) {
        memberships.push({
          group: {
            id: group.id,
            name: group.name,
            invite_code: group.invite_code
          },
          member: {
            id: member.id,
            name: member.name,
            color: member.color,
            is_admin: member.is_admin,
            user_id: member.user_id
          }
        });
      }
    }
    
    return memberships;
  }, [userId]);
}

export function useLocalGroup(groupId: string | undefined): GroupDetailResponse | undefined {
  return useLiveQuery(async () => {
    if (!groupId) return undefined;
    
    const group = await db.groups.get(groupId);
    if (!group || group.is_deleted === true) return undefined;
    
    const groupMembers = await db.members
      .filter(m => m.group_id === groupId && m.is_deleted !== true)
      .toArray();
      
    const membersList = groupMembers.map(m => ({
      id: m.id,
      name: m.name,
      color: m.color,
      is_admin: m.is_admin,
      user_id: m.user_id,
      balance: m.balance
    }));
    
    const simplified_debts = simplifyDebts(membersList);
    
    return {
      id: group.id,
      name: group.name,
      invite_code: group.invite_code,
      members: membersList,
      simplified_debts
    };
  }, [groupId]);
}

export function useLocalActivity(groupId: string | undefined): ActivityResponse[] | undefined {
  return useLiveQuery(async () => {
    if (!groupId) return [];
    
    const expenses = await db.expenses
      .filter(e => e.group_id === groupId && e.is_deleted !== true)
      .toArray();
      
    const settlements = await db.settlements
      .filter(s => s.group_id === groupId && s.is_deleted !== true)
      .toArray();
      
    const allMembers = await db.members
      .filter(m => m.group_id === groupId)
      .toArray();
      
    const memberMap = new Map(allMembers.map(m => [m.id, m]));
    
    const activity: ActivityResponse[] = [];
    
    for (const exp of expenses) {
      const splits = await db.expenseSplits
        .filter(s => s.expense_id === exp.id)
        .toArray();
        
      const splitInfo = splits.map(s => ({
        member_id: s.member_id,
        name: memberMap.get(s.member_id)?.name || 'Unknown',
        share_amount: s.share_amount
      }));
      
      activity.push({
        id: exp.id,
        type: 'expense',
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        paid_by: exp.paid_by,
        created_by_user_id: exp.created_by_user_id,
        paid_by_name: memberMap.get(exp.paid_by)?.name || 'Unknown',
        split_type: exp.split_type,
        splits: splitInfo,
        created_at: exp.created_at
      });
    }
    
    for (const set of settlements) {
      activity.push({
        id: set.id,
        type: 'settlement',
        description: 'Settlement',
        amount: set.amount,
        from_member: set.from_member,
        to_member: set.to_member,
        from_name: memberMap.get(set.from_member)?.name || 'Unknown',
        to_name: memberMap.get(set.to_member)?.name || 'Unknown',
        paid_by_name: memberMap.get(set.from_member)?.name || 'Unknown', // mapped conceptually
        created_at: set.created_at
      });
    }
    
    return activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [groupId]);
}

export function useLocalPendingCount(): number | undefined {
  return useLiveQuery(() => db.pendingChanges.count(), []);
}
