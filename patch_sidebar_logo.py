with open("frontend/src/components/Sidebar.tsx", "r") as f:
    content = f.read()

import re

# We need to wrap the h2 with Link to "/"
# But wait, Link might already be imported from react-router-dom
if "from 'react-router-dom'" not in content:
    # Sidebar currently uses Link, let's check
    pass

old_h2 = """
      <div className="p-[24px] pb-[16px] flex items-center justify-between">
        <h2 className="font-display text-[24px] font-semibold text-ink flex items-center gap-2 m-0">
          <Users size={24} className="text-brass" /> Evenly
        </h2>
      </div>
"""

new_h2 = """
      <div className="p-[24px] pb-[16px] flex items-center justify-between">
        <Link to="/" className="text-decoration-none">
          <h2 className="font-display text-[24px] font-semibold text-ink flex items-center gap-2 m-0 hover:opacity-80 transition-opacity cursor-pointer">
            <Users size={24} className="text-brass" /> Evenly
          </h2>
        </Link>
      </div>
"""

content = content.replace(old_h2.strip(), new_h2.strip())

with open("frontend/src/components/Sidebar.tsx", "w") as f:
    f.write(content)
