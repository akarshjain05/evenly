export const SETTLEMENT_TOLERANCE = 0.01;

export function simplifyDebts(members: { id: string, name: string, balance: string | number }[]) {
  const creditors: { amount: number, id: string, name: string }[] = [];
  const debtors: { amount: number, id: string, name: string }[] = [];

  for (const m of members) {
    const bal = Number(m.balance);
    if (bal > SETTLEMENT_TOLERANCE) creditors.push({ amount: bal, id: m.id, name: m.name });
    else if (bal < -SETTLEMENT_TOLERANCE) debtors.push({ amount: Math.abs(bal), id: m.id, name: m.name });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const c = creditors[cIdx];
    const d = debtors[dIdx];

    const pay = Math.min(c.amount, d.amount);
    
    if (pay > SETTLEMENT_TOLERANCE) {
      transactions.push({
        from_member: d.id,
        to_member: c.id,
        from_name: d.name,
        to_name: c.name,
        amount: Number(pay.toFixed(2))
      });
    }

    c.amount -= pay;
    d.amount -= pay;

    // We don't really need to constantly re-sort if we just do standard pointers, 
    // but to perfectly mimic the python heap we can re-sort the remaining items
    if (c.amount < SETTLEMENT_TOLERANCE) cIdx++;
    else {
        // Re-sort the rest of the array starting from cIdx
        const rest = creditors.splice(cIdx);
        rest.sort((a, b) => b.amount - a.amount);
        creditors.push(...rest);
    }

    if (d.amount < SETTLEMENT_TOLERANCE) dIdx++;
    else {
        const rest = debtors.splice(dIdx);
        rest.sort((a, b) => b.amount - a.amount);
        debtors.push(...rest);
    }
  }

  return transactions;
}

export function calculateEqualSplits(amount: number, participantIds: string[]): { member_id: string, name: string, share_amount: string }[] {
  if (participantIds.length === 0) return [];
  
  const num = participantIds.length;
  // Use Banker's Rounding to match Python's decimal.quantize(Decimal('0.01'), rounding=ROUND_HALF_EVEN)
  const rawShare = amount / num;
  let shareCents = Math.round(rawShare * 100);
  
  // Apply half-even rounding if it falls exactly on the .5 cent mark
  if (Math.abs((rawShare * 100) % 1) === 0.5) {
      const floor = Math.floor(rawShare * 100);
      shareCents = (floor % 2 === 0) ? floor : Math.ceil(rawShare * 100);
  }
  
  const shareFloat = shareCents / 100;
  
  // In Javascript, to fixed floats can be nasty. We calculate remainder carefully.
  // We recreate exactly what Python does: remainder = amount - (share * num)
  const remainder = Math.round((amount - (shareFloat * num)) * 100) / 100;
  
  return participantIds.map((id, index) => {
    let amt = shareFloat;
    if (index === 0) {
      amt = Math.round((amt + remainder) * 100) / 100;
    }
    return {
      member_id: id,
      name: '',
      share_amount: amt.toFixed(2)
    };
  });
}

import type { GroupDetailResponse, ExpenseCreate, ActivityResponse } from '../types/api';

export function calculateExpenseBalanceChanges(
  members: GroupDetailResponse['members'],
  newExpense?: ExpenseCreate,
  oldExpense?: ActivityResponse
): { member_id: string; net_change: number }[] {
  const changes: { member_id: string; net_change: number }[] = [];
  
  members.forEach((m) => {
    let netChange = 0;

    // 1. Revert old expense if provided
    if (oldExpense) {
      if (oldExpense.splits && oldExpense.splits.length > 0) {
        if (m.id === oldExpense.paid_by) netChange -= oldExpense.amount;
        const split = oldExpense.splits.find((s) => s.member_id === m.id);
        if (split) netChange += Number(split.share_amount);
      } else {
        const share = oldExpense.amount / members.length;
        if (m.id === oldExpense.paid_by) netChange -= oldExpense.amount;
        netChange += share;
      }
    }

    // 2. Apply new expense if provided
    if (newExpense && newExpense.split_type === 'equal') {
      const parts = newExpense.participant_ids || members.map((mem) => mem.id);
      if (parts.length > 0) {
        const fakeSplits = calculateEqualSplits(newExpense.amount, parts);
        if (m.id === newExpense.paid_by) netChange += newExpense.amount;
        const split = fakeSplits.find(s => s.member_id === m.id);
        if (split) netChange -= Number(split.share_amount);
      }
    }

    changes.push({ member_id: m.id, net_change: netChange });
  });

  return changes;
}
