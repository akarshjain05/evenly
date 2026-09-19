import type { GroupDetailResponse } from '../../types/api';
import { formatCurrency } from '../../utils/currency';

export const BalancesSidebar = ({ group, getDisplayName }: { group: GroupDetailResponse, getDisplayName: (id: string, defaultName: string) => string }) => (
  <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
    <div className="p-5 border-b border-line-paper">
      <h2 className="text-xl font-semibold m-0 text-ink">Balances</h2>
    </div>
    <div className="p-5 space-y-4">
      {group.members.map((m: GroupDetailResponse['members'][0]) => (
        <div key={m.id} className="flex justify-between items-center">
          <span className="font-medium text-ink">{getDisplayName(m.id, m.name)}</span>
          <span className={`font-semibold ${Number(m.balance) > 0 ? 'text-primary' : Number(m.balance) < 0 ? 'text-danger' : 'text-ink-soft'}`}>
            {formatCurrency(m.balance, true)}
          </span>
        </div>
      ))}
    </div>
  </div>
);
