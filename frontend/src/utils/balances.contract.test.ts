import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { simplifyDebts } from './balances';

describe('Debt Simplification Contract Test', () => {
  it('should produce identical results as the Python backend algorithm', () => {
    const scenarios = [
      [
        { id: 'A', name: 'Alice', balance: '100.00' },
        { id: 'B', name: 'Bob', balance: '-50.00' },
        { id: 'C', name: 'Charlie', balance: '-50.00' }
      ],
      [
        { id: 'A', name: 'Alice', balance: '33.34' },
        { id: 'B', name: 'Bob', balance: '-16.67' },
        { id: 'C', name: 'Charlie', balance: '-16.67' }
      ],
      [
        { id: 'A', name: 'Alice', balance: '12.50' },
        { id: 'B', name: 'Bob', balance: '12.50' },
        { id: 'C', name: 'Charlie', balance: '-25.00' }
      ],
      [
        { id: '1', name: 'P1', balance: '1000' },
        { id: '2', name: 'P2', balance: '500' },
        { id: '3', name: 'P3', balance: '-200' },
        { id: '4', name: 'P4', balance: '-800' },
        { id: '5', name: 'P5', balance: '-500' }
      ],
      [
        { id: 'A', name: 'Alice', balance: '0.00' },
        { id: 'B', name: 'Bob', balance: '0.01' },
        { id: 'C', name: 'Charlie', balance: '-0.01' }
      ]
    ];

    for (const members of scenarios) {
      const tsResultFull = simplifyDebts(members);
      // Strip out names to match python output schema
      const tsResult = tsResultFull.map(t => ({
        from_member: t.from_member,
        to_member: t.to_member,
        amount: t.amount
      }));

      const pythonScript = `
import json
import sys
from decimal import Decimal
import os
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '..')))
from app.balances import simplify_debts

input_data = json.loads('${JSON.stringify(members)}')
net = {m['id']: Decimal(m['balance']) for m in input_data}

res = simplify_debts(net)
output = []
for r in res:
    output.append({
        'from_member': r['from_member'],
        'to_member': r['to_member'],
        'amount': float(r['amount'])
    })

print(json.dumps(output))
`;
      const pythonOutput = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
      const pythonResult = JSON.parse(pythonOutput);

      // Sort arrays before deep equal to avoid order issues, though the algorithms should technically produce the exact same order!
      const sortByAmountAndIds = (a: any, b: any) => 
        b.amount - a.amount || a.from_member.localeCompare(b.from_member) || a.to_member.localeCompare(b.to_member);
      
      expect(tsResult.sort(sortByAmountAndIds)).toEqual(pythonResult.sort(sortByAmountAndIds));
    }
  });
});
