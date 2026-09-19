import re

with open('frontend/src/pages/GroupView.tsx', 'r') as f:
    content = f.read()

# We need to extract the item rendering logic.
# Look for `{activities?.map((item) => (`
map_start = content.find('{activities?.map((item) => (')
if map_start == -1:
    print("Could not find map start")
    exit(1)

# Find the end of the map block by counting braces
open_braces = 0
map_end = -1
for i in range(map_start + 26, len(content)): # 26 is len('{activities?.map((item) => (')
    if content[i] == '(':
        open_braces += 1
    elif content[i] == ')':
        if open_braces == 0:
            map_end = i + 1 # include the ')'
            break
        open_braces -= 1

if map_end == -1:
    print("Could not find map end")
    exit(1)

# We know the outer structure is:
#             <div className="divide-y divide-line-paper">
#               {activities?.length === 0 && (
#                 <p className="text-ink-soft italic text-center py-8">No expenses yet.</p>
#               )}
#               {activities?.map((item) => ( ... ))}
#             </div>
#           </div>

render_item_logic = content[map_start + 27 : map_end - 1] # inside (item) => ( ... )

# Let's insert renderActivityItem right before `return (`
return_idx = content.find('  return (\n    <div className="max-w-4xl')

expenses_filter = "  const expenses = activities?.filter(a => a.type === 'expense') || [];\n"
settlements_filter = "  const settlements = activities?.filter(a => a.type === 'settlement') || [];\n\n"

render_helper = f"""  const renderActivityItem = (item: any) => (
{render_item_logic}
  );

"""

# Build the new UI sections
new_activity_ui = """            
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
            </div>"""

# Find where to replace the activity UI
activity_div_start = content.find('<div className="divide-y divide-line-paper">', return_idx)
activity_div_end = content.find('            </div>\n          </div>', activity_div_start) + 14

content = content[:return_idx] + expenses_filter + settlements_filter + render_helper + content[return_idx:activity_div_start] + new_activity_ui + content[activity_div_end:]

with open('frontend/src/pages/GroupView.tsx', 'w') as f:
    f.write(content)
print("Success")
