import { formatCurrency } from '../../utils/currency';

export const SettleSuggestions = ({ group, getDisplayName }: any) => {
  if (!group.simplified_debts || group.simplified_debts.length === 0) return null;
  return (
    <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
      <div className="p-5 border-b border-line-paper">
        <h2 className="text-xl font-semibold m-0 text-ink">How to settle up</h2>
      </div>
      <div className="p-5 space-y-4">
        {group.simplified_debts.map((debt: any, i: number) => (
          <div key={i} className="text-sm text-ink-soft flex justify-between items-center">
            <span>
              <span className="font-semibold text-ink">{getDisplayName(debt.from_member, debt.from_name)}</span> {getDisplayName(debt.from_member, debt.from_name) === 'You' ? 'owe' : 'owes'} <span className="font-semibold text-ink">{getDisplayName(debt.to_member, debt.to_name)}</span>
            </span>
            <span className="font-semibold text-ink">{formatCurrency(debt.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
