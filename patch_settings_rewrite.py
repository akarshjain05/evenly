import re

with open("frontend/src/pages/SettingsPage.tsx", "r") as f:
    content = f.read()

# First, remove the old bottom pane
content = re.sub(r'<div className="p-5 sm:p-6 bg-paper-dim border-t border-line-dark flex justify-end">.*?</div>\s*</div>\s*</div>\s*\);\s*}', '</div></div>);}', content, flags=re.DOTALL)

# Now, insert the new card at the end of the flex-col gap-4 container
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

# The closing tags before were:
#         </div>
#       </div>
#     </div>
#   );
# }

# Find the end of the p-5 sm:p-6 flex flex-col gap-4 container
content = content.replace("</button>\n          </div>\n\n        </div></div></div>", "</button>\n          </div>" + new_card + "\n        </div>\n      </div>\n    </div>\n")


with open("frontend/src/pages/SettingsPage.tsx", "w") as f:
    f.write(content)
