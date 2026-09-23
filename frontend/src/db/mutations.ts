import { db } from './db';
import { syncEngine } from './syncEngine';
import type { ExpenseCreate, SettlementCreate } from '../types/api';
import type { LocalExpense, LocalExpenseSplit, LocalSettlement } from './db';

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export async function addExpense(groupId: string, expense: ExpenseCreate, userId: string | null) {
  const expenseId = generateId();
  const now = new Date().toISOString();
  
  await db.transaction('rw', [db.expenses, db.expenseSplits, db.members, db.pendingChanges], async () => {
    // 1. Determine participants and splits
    let participantIds = expense.participant_ids || [];
    if (!participantIds.length) {
      const allMembers = await db.members.filter(m => m.group_id === groupId && m.is_deleted !== true).toArray();
      participantIds = allMembers.map(m => m.id);
    }

    const shareAmount = Number((expense.amount / participantIds.length).toFixed(2));
    
    const splits: LocalExpenseSplit[] = participantIds.map(memberId => ({
      id: generateId(),
      expense_id: expenseId,
      member_id: memberId,
      share_amount: shareAmount,
      updated_at: now
    }));

    const localExpense: LocalExpense = {
      id: expenseId,
      group_id: groupId,
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paid_by,
      split_type: expense.split_type || 'equal',
      category: expense.category || 'general',
      created_at: now,
      updated_at: now,
      is_deleted: false,
      created_by_user_id: userId
    };

    // 2. Write to DB
    await db.expenses.add(localExpense);
    await db.expenseSplits.bulkAdd(splits);

    // 3. Update balances
    const payer = await db.members.get(expense.paid_by);
    if (payer) {
      await db.members.update(payer.id, { balance: payer.balance + expense.amount, updated_at: now });
    }
    
    for (const split of splits) {
      const member = await db.members.get(split.member_id);
      if (member) {
        await db.members.update(member.id, { balance: member.balance - split.share_amount, updated_at: now });
      }
    }

    // 4. Queue pending change
    await db.pendingChanges.add({
      table: 'expenses',
      action: 'create',
      entity_id: expenseId,
      group_id: groupId,
      data: expense as unknown as Record<string, unknown>,
      created_at: now
    });
  });

  syncEngine.requestSync();
}

export async function editExpense(groupId: string, expenseId: string, expense: ExpenseCreate) {
  const now = new Date().toISOString();
  
  await db.transaction('rw', [db.expenses, db.expenseSplits, db.members, db.pendingChanges], async () => {
    const oldExpense = await db.expenses.get(expenseId);
    if (!oldExpense) throw new Error('Expense not found');
    
    const oldSplits = await db.expenseSplits.filter(s => s.expense_id === expenseId).toArray();

    // Revert old balances
    const oldPayer = await db.members.get(oldExpense.paid_by);
    if (oldPayer) {
      await db.members.update(oldPayer.id, { balance: oldPayer.balance - oldExpense.amount, updated_at: now });
    }
    for (const split of oldSplits) {
      const member = await db.members.get(split.member_id);
      if (member) {
        await db.members.update(member.id, { balance: member.balance + split.share_amount, updated_at: now });
      }
    }
    
    // Delete old splits
    await db.expenseSplits.bulkDelete(oldSplits.map(s => s.id));

    // Determine new participants and splits
    let participantIds = expense.participant_ids || [];
    if (!participantIds.length) {
      const allMembers = await db.members.filter(m => m.group_id === groupId && m.is_deleted !== true).toArray();
      participantIds = allMembers.map(m => m.id);
    }
    
    const shareAmount = Number((expense.amount / participantIds.length).toFixed(2));
    
    const newSplits: LocalExpenseSplit[] = participantIds.map(memberId => ({
      id: generateId(),
      expense_id: expenseId,
      member_id: memberId,
      share_amount: shareAmount,
      updated_at: now
    }));

    // Update expense record
    await db.expenses.update(expenseId, {
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paid_by,
      split_type: expense.split_type || 'equal',
      category: expense.category || 'general',
      updated_at: now
    });
    
    // Create new splits
    await db.expenseSplits.bulkAdd(newSplits);

    // Apply new balances
    const newPayer = await db.members.get(expense.paid_by);
    if (newPayer) {
      await db.members.update(newPayer.id, { balance: newPayer.balance + expense.amount, updated_at: now });
    }
    for (const split of newSplits) {
      const member = await db.members.get(split.member_id);
      if (member) {
        await db.members.update(member.id, { balance: member.balance - split.share_amount, updated_at: now });
      }
    }

    await db.pendingChanges.add({
      table: 'expenses',
      action: 'update',
      entity_id: expenseId,
      group_id: groupId,
      data: expense as unknown as Record<string, unknown>,
      created_at: now
    });
  });

  syncEngine.requestSync();
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const now = new Date().toISOString();
  
  await db.transaction('rw', [db.expenses, db.expenseSplits, db.members, db.pendingChanges], async () => {
    const expense = await db.expenses.get(expenseId);
    if (!expense) return;
    
    const splits = await db.expenseSplits.filter(s => s.expense_id === expenseId).toArray();

    // Revert balances
    const payer = await db.members.get(expense.paid_by);
    if (payer) {
      await db.members.update(payer.id, { balance: payer.balance - expense.amount, updated_at: now });
    }
    for (const split of splits) {
      const member = await db.members.get(split.member_id);
      if (member) {
        await db.members.update(member.id, { balance: member.balance + split.share_amount, updated_at: now });
      }
    }

    // Soft delete
    await db.expenses.update(expenseId, { is_deleted: true, updated_at: now });
    
    await db.pendingChanges.add({
      table: 'expenses',
      action: 'delete',
      entity_id: expenseId,
      group_id: groupId,
      created_at: now
    });
  });

  syncEngine.requestSync();
}

export async function addSettlement(groupId: string, settlement: SettlementCreate, userId: string | null) {
  const settlementId = generateId();
  const now = new Date().toISOString();
  
  await db.transaction('rw', [db.settlements, db.members, db.pendingChanges], async () => {
    const localSettlement: LocalSettlement = {
      id: settlementId,
      group_id: groupId,
      from_member: settlement.from_member,
      to_member: settlement.to_member,
      amount: settlement.amount,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      created_by_user_id: userId
    };

    await db.settlements.add(localSettlement);

    const fromMember = await db.members.get(settlement.from_member);
    if (fromMember) {
      await db.members.update(fromMember.id, { balance: fromMember.balance + settlement.amount, updated_at: now });
    }
    
    const toMember = await db.members.get(settlement.to_member);
    if (toMember) {
      await db.members.update(toMember.id, { balance: toMember.balance - settlement.amount, updated_at: now });
    }

    await db.pendingChanges.add({
      table: 'settlements',
      action: 'create',
      entity_id: settlementId,
      group_id: groupId,
      data: settlement as unknown as Record<string, unknown>,
      created_at: now
    });
  });

  syncEngine.requestSync();
}

export async function editSettlement(groupId: string, settlementId: string, settlement: SettlementCreate) {
  const now = new Date().toISOString();
  
  await db.transaction('rw', [db.settlements, db.members, db.pendingChanges], async () => {
    const oldSettlement = await db.settlements.get(settlementId);
    if (!oldSettlement) throw new Error('Settlement not found');

    // Revert old balances
    const oldFrom = await db.members.get(oldSettlement.from_member);
    if (oldFrom) {
      await db.members.update(oldFrom.id, { balance: oldFrom.balance - oldSettlement.amount, updated_at: now });
    }
    const oldTo = await db.members.get(oldSettlement.to_member);
    if (oldTo) {
      await db.members.update(oldTo.id, { balance: oldTo.balance + oldSettlement.amount, updated_at: now });
    }

    // Update settlement
    await db.settlements.update(settlementId, {
      from_member: settlement.from_member,
      to_member: settlement.to_member,
      amount: settlement.amount,
      updated_at: now
    });

    // Apply new balances
    const newFrom = await db.members.get(settlement.from_member);
    if (newFrom) {
      await db.members.update(newFrom.id, { balance: newFrom.balance + settlement.amount, updated_at: now });
    }
    const newTo = await db.members.get(settlement.to_member);
    if (newTo) {
      await db.members.update(newTo.id, { balance: newTo.balance - settlement.amount, updated_at: now });
    }

    await db.pendingChanges.add({
      table: 'settlements',
      action: 'update',
      entity_id: settlementId,
      group_id: groupId,
      data: settlement as unknown as Record<string, unknown>,
      created_at: now
    });
  });

  syncEngine.requestSync();
}

export async function deleteSettlement(groupId: string, settlementId: string) {
  const now = new Date().toISOString();
  
  await db.transaction('rw', [db.settlements, db.members, db.pendingChanges], async () => {
    const settlement = await db.settlements.get(settlementId);
    if (!settlement) return;

    // Revert balances
    const fromMember = await db.members.get(settlement.from_member);
    if (fromMember) {
      await db.members.update(fromMember.id, { balance: fromMember.balance - settlement.amount, updated_at: now });
    }
    const toMember = await db.members.get(settlement.to_member);
    if (toMember) {
      await db.members.update(toMember.id, { balance: toMember.balance + settlement.amount, updated_at: now });
    }

    // Soft delete
    await db.settlements.update(settlementId, { is_deleted: true, updated_at: now });

    await db.pendingChanges.add({
      table: 'settlements',
      action: 'delete',
      entity_id: settlementId,
      group_id: groupId,
      created_at: now
    });
  });

  syncEngine.requestSync();
}
