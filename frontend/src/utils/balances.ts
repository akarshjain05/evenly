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
