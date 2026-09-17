with open("frontend/src/pages/SettingsPage.tsx", "r") as f:
    content = f.read()

import re

# Remove the bottom pane
bottom_pane = r'<div className="p-5 sm:p-6 bg-paper-dim border-t border-line-dark flex justify-end">.*?</div>'
content = re.sub(bottom_pane, '', content, flags=re.DOTALL)

# Add the new card inside the main container
new_card = """
          <div className="flex items-center justify-between p-4 border border-[#c81e1e] border-opacity-30 bg-[#c81e1e] bg-opacity-5 rounded-[12px]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center shrink-0 border border-line-dark">
                <LogOut className="text-[#c81e1e]" size={20} />
              </div>
              <div>
                <div className="font-medium text-[15px] text-[#c81e1e]">Sign Out</div>
                <div className="text-[13px] text-ink-soft mt-0.5">End your current session</div>
              </div>
            </div>
            <button 
              onClick={async () => {
                if (await showConfirm('Sign Out', 'Are you sure you want to sign out?', { danger: true })) {
                  logout();
                }
              }}
              className="px-4 py-2 text-[14px] font-medium rounded-xl transition-colors cursor-pointer border border-[#c81e1e] text-[#c81e1e] hover:bg-[#c81e1e] hover:text-white bg-transparent"
            >
              Sign Out
            </button>
          </div>
"""

# Insert before the closing div of the main container
content = content.replace("</div>\n\n        <div className=\"p-5 sm:p-6 bg-paper-dim", new_card + "\n        </div>\n\n        <div className=\"p-5 sm:p-6 bg-paper-dim")
content = re.sub(bottom_pane, '', content, flags=re.DOTALL)

with open("frontend/src/pages/SettingsPage.tsx", "w") as f:
    f.write(content)
