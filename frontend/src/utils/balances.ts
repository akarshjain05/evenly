export const SETTLEMENT_TOLERANCE = 0.01;

export function simplifyDebts(members: { id: string, name: string, balance: string | number }[]) {
  const creditors: { amount: number, id: string, name: string }[] = [];
  const debtors: { amount: number, id: string, name: string }[] = [];

  for (const m of members) {
    const bal = Number(m.balance);
    if (bal > SETTLEMENT_TOLERANCE) creditors.push({ amount: bal, id: m.id, name: m.name });
    else if (bal < -SETTLEMENT_TOLERANCE) debtors.push({ amount: Math.abs(bal), id: m.id, name: m.name });
  }

  creditors.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
  debtors.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));

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
    if (c.amount < SETTLEMENT_TOLERANCE) {
      cIdx++;
    } else {
      let i = cIdx + 1;
      while (i < creditors.length && creditors[i].amount > c.amount) {
        // Tie-breaker matching Python's heapq: if amounts are equal, sort by ID ascending
        if (creditors[i].amount === c.amount && creditors[i].id < c.id) {
          break;
        }
        i++;
      }
      if (i > cIdx + 1) {
        const temp = creditors[cIdx];
        for (let j = cIdx; j < i - 1; j++) {
          creditors[j] = creditors[j + 1];
        }
        creditors[i - 1] = temp;
      }
    }

    if (d.amount < SETTLEMENT_TOLERANCE) {
      dIdx++;
    } else {
      let i = dIdx + 1;
      while (i < debtors.length && debtors[i].amount > d.amount) {
        if (debtors[i].amount === d.amount && debtors[i].id < d.id) {
          break;
        }
        i++;
      }
      if (i > dIdx + 1) {
        const temp = debtors[dIdx];
        for (let j = dIdx; j < i - 1; j++) {
          debtors[j] = debtors[j + 1];
        }
        debtors[i - 1] = temp;
      }
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




