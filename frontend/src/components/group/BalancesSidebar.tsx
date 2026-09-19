
export const BalancesSidebar = ({ group, getDisplayName }: any) => (
  <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
    <div className="p-5 border-b border-line-paper">
      <h2 className="text-xl font-semibold m-0 text-ink">Balances</h2>
    </div>
    <div className="p-5 space-y-4">
      {group.members.map((m: any) => (
        <div key={m.id} className="flex justify-between items-center">
          <span className="font-medium text-ink">{getDisplayName(m.id, m.name)}</span>
          <span className={`font-semibold ${Number(m.balance) > 0 ? 'text-primary' : Number(m.balance) < 0 ? 'text-danger' : 'text-ink-soft'}`}>
            {Number(m.balance) > 0 ? '+' : ''}{Number(m.balance).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  </div>
);
