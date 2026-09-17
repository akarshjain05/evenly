with open("frontend/src/pages/GroupView.tsx", "r") as f:
    content = f.read()

import_statement = "import { Plus, Handshake, Share2, MoreVertical, Trash2 } from 'lucide-react';"
new_import = "import { Plus, Handshake, Share2, MoreVertical, Trash2, Moon, Sun } from 'lucide-react';\nimport { useState as useReactState, useEffect as useReactEffect } from 'react';"
content = content.replace(import_statement, new_import)

# Find the header section to inject the mode toggle
header_buttons_start = """          <button
            onClick={() => {"""

mode_toggle_code = """
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

          <button
            onClick={() => {"""

content = content.replace(header_buttons_start, mode_toggle_code)

with open("frontend/src/pages/GroupView.tsx", "w") as f:
    f.write(content)
