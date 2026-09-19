import re

with open('frontend/src/pages/GroupView.tsx', 'r') as f:
    content = f.read()

# 1. Insert useState
state_line = "  const [activeActivityTab, setActiveActivityTab] = useState<'expenses' | 'settlements'>('expenses');"
if 'activeActivityTab' not in content:
    content = content.replace(
        "  const [isShareOpen, setIsShareOpen] = useState(false);",
        "  const [isShareOpen, setIsShareOpen] = useState(false);\n" + state_line
    )

# 2. Replace the Activity block
old_activity_block = """          <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
            <div className="px-6 py-5 border-b border-line-paper flex justify-between items-center">
               <h2 className="text-xl font-semibold m-0 text-ink">Activity</h2>
            </div>
                        
            <div className="bg-bg-soft px-6 py-2 border-b border-line-paper">
              <h3 className="text-[13px] font-semibold text-ink-soft tracking-wider uppercase m-0">Normal Payments</h3>
            </div>
            <div className="divide-y divide-line-paper">
              {expenses.length === 0 && (
                <p className="text-ink-soft italic text-center py-6 text-[15px]">No normal payments yet.</p>
              )}
              {expenses.map(renderActivityItem)}
            </div>

            <div className="bg-bg-soft px-6 py-2 border-y border-line-paper mt-2">
              <h3 className="text-[13px] font-semibold text-ink-soft tracking-wider uppercase m-0">Settlements</h3>
            </div>
            <div className="divide-y divide-line-paper">
              {settlements.length === 0 && (
                <p className="text-ink-soft italic text-center py-6 text-[15px]">No settlements yet.</p>
              )}
              {settlements.map(renderActivityItem)}
            </div>
          </div>"""

new_activity_block = """          <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-line-paper flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h2 className="text-xl font-semibold m-0 text-ink">Activity</h2>
               
               <div className="flex bg-bg-soft rounded-full p-1 gap-1 w-full sm:w-auto min-w-[220px] border border-line-dark shadow-sm">
                <button 
                  onClick={() => setActiveActivityTab('expenses')}
                  className={`flex-1 sm:px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border-none cursor-pointer ${activeActivityTab === 'expenses' ? 'bg-primary text-white shadow-sm' : 'text-ink-soft hover:text-ink bg-transparent'}`}
                >
                  Payments
                </button>
                <button 
                  onClick={() => setActiveActivityTab('settlements')}
                  className={`flex-1 sm:px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border-none cursor-pointer ${activeActivityTab === 'settlements' ? 'bg-primary text-white shadow-sm' : 'text-ink-soft hover:text-ink bg-transparent'}`}
                >
                  Settlements
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-line-paper">
              {activeActivityTab === 'expenses' ? (
                <>
                  {expenses.length === 0 && (
                    <p className="text-ink-soft italic text-center py-8 text-[15px]">No normal payments yet.</p>
                  )}
                  {expenses.map(renderActivityItem)}
                </>
              ) : (
                <>
                  {settlements.length === 0 && (
                    <p className="text-ink-soft italic text-center py-8 text-[15px]">No settlements yet.</p>
                  )}
                  {settlements.map(renderActivityItem)}
                </>
              )}
            </div>
          </div>"""

if old_activity_block in content:
    content = content.replace(old_activity_block, new_activity_block)
else:
    print("Could not find old activity block")
    exit(1)

with open('frontend/src/pages/GroupView.tsx', 'w') as f:
    f.write(content)
print("Success")
