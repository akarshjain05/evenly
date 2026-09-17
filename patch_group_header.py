with open("frontend/src/pages/GroupView.tsx", "r") as f:
    content = f.read()

import re

# Remove the duplicated theme toggle block
old_block = """
          <button
            onClick={() => {
              const isDark = document.documentElement.classList.contains('dark');
              if (isDark) {
                document.documentElement.classList.remove('dark');
                localStorage.theme = 'light';
              } else {
                document.documentElement.classList.add('dark');
                localStorage.theme = 'dark';
              }
              // Force re-render to update icon (simplest way without global state for this specific button)
              window.dispatchEvent(new Event('theme-change'));
            }}
            className="p-2 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer"
            title="Toggle Dark Mode"
          >
            <Moon className="hidden dark:block" size={20} />
            <Sun className="block dark:hidden" size={20} />
          </button>
"""

content = content.replace(old_block, "")

with open("frontend/src/pages/GroupView.tsx", "w") as f:
    f.write(content)
