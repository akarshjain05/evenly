import { describe, it, expect } from 'vitest';
import { simplifyDebts } from './balances';

describe('simplifyDebts', () => {
  it('should ignore members with zero balance', () => {
    const members = [
      { id: '1', name: 'A', balance: 0 },
      { id: '2', name: 'B', balance: 0.009 }, // Below tolerance
    ];
    const txs = simplifyDebts(members);
    expect(txs).toHaveLength(0);
  });

  it('should resolve a simple 1:1 debt', () => {
    const members = [
      { id: '1', name: 'Alice', balance: 50 },
      { id: '2', name: 'Bob', balance: -50 },
    ];
    const txs = simplifyDebts(members);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toEqual({
      from_member: '2',
      from_name: 'Bob',
      to_member: '1',
      to_name: 'Alice',
      amount: 50
    });
  });

  it('should simplify a 3-way chain', () => {
    // A owes B 50 (B: +50, A: -50)
    // B owes C 50 (C: +50, B: -50 -> B is 0)
    // End result: A owes C 50.
    const members = [
      { id: 'A', name: 'A', balance: -50 },
      { id: 'B', name: 'B', balance: 0 },
      { id: 'C', name: 'C', balance: 50 },
    ];
    const txs = simplifyDebts(members);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({
      from_member: 'A',
      to_member: 'C',
      amount: 50
    });
  });

  it('should properly route multiple debtors to one creditor', () => {
    const members = [
      { id: 'A', name: 'Alice', balance: -30 },
      { id: 'B', name: 'Bob', balance: -20 },
      { id: 'C', name: 'Charlie', balance: 50 },
    ];
    const txs = simplifyDebts(members);
    expect(txs).toHaveLength(2);
    // Because Alice is -30 (abs 30) and Bob is -20 (abs 20), Alice gets processed first against Charlie
    expect(txs).toContainEqual(expect.objectContaining({ from_member: 'A', to_member: 'C', amount: 30 }));
    expect(txs).toContainEqual(expect.objectContaining({ from_member: 'B', to_member: 'C', amount: 20 }));
  });
});
