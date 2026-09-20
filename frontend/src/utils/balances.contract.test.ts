import { describe, it, expect } from 'vitest';
import { simplifyDebts } from './balances';
import fs from 'fs';
import path from 'path';

describe('Debt Simplification Contract Test', () => {
  it('should produce identical results as the shared cross-platform fixture', () => {
    // Read the shared JSON fixture
    const fixturePath = path.resolve(__dirname, '../../../tests/fixtures/balances_scenarios.json');
    const scenarios = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

    for (const scenario of scenarios) {
      const tsResultFull = simplifyDebts(scenario.input);
      // Strip out names to match output schema
      const tsResult = tsResultFull.map(t => ({
        from_member: t.from_member,
        to_member: t.to_member,
        amount: Number(t.amount)
      }));

      // Sort arrays before deep equal to avoid order issues, though the algorithms should technically produce the exact same order!
      const sortByAmountAndIds = (a: any, b: any) => 
        b.amount - a.amount || a.from_member.localeCompare(b.from_member) || a.to_member.localeCompare(b.to_member);
      
      expect(tsResult.sort(sortByAmountAndIds)).toEqual(scenario.expected.sort(sortByAmountAndIds));
    }
  });
});
