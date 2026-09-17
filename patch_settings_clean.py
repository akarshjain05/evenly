import re
with open("frontend/src/pages/SettingsPage.tsx", "r") as f:
    text = f.read()

# First, restore the file to the original state just in case
# Wait, it is currently in a state where the bottom pane is missing entirely
# Let's check if the bottom pane is there
if "bg-paper-dim" in text:
    text = re.sub(r'<div className="p-5 sm:p-6 bg-paper-dim.*?</div>\s*</div>\s*</div>\s*\);\s*}', '</div>\n      </div>\n    </div>\n  );\n}', text, flags=re.DOTALL)

# Now find the last </div> before the end
# The end of the file looks like:
#         </div>
#       </div>
#     </div>
#   );
# }

new_card = """
          <div className="flex items-center justify-between p-4 border border-[#c81e1e] border-opacity-30 bg-[#c81e1e] bg-opacity-5 rounded-[12px]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center shrink-0 border border-line-dark">
                <LogOut className="text-[#c81e1e]" size={20} />
              </div>
              <div>
                <div className="font-medium text-[15px] text-[#c81e1e]">Sign Out</div>
                <div className="text-[13px] text-[#c81e1e] opacity-80 mt-0.5">End your current session</div>
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

# Insert it before the first of the last 3 closing divs
# Let's split by "        </div>\n\n        \n      </div>\n    </div>\n  );\n}"
text = re.sub(r'\s*</div>\s*</div>\s*</div>\s*\);\s*}\s*$', '\n' + new_card + '\n        </div>\n      </div>\n    </div>\n  );\n}', text)

with open("frontend/src/pages/SettingsPage.tsx", "w") as f:
    f.write(text)
