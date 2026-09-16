import re

with open("app/static/style.css", "r") as f:
    code = f.read()

# 1. Add -webkit-tap-highlight-color to *
old_star = """* {
  box-sizing: border-box;
}"""

new_star = """* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}"""

code = code.replace(old_star, new_star)

# 2. Add subtle :active states for buttons to make them feel natural
# Find where .sidebar-link:hover is, replace/append with :active
old_sidebar_hover = """.sidebar-link:hover {
  background: var(--paper-dim);
}"""

new_sidebar_hover = """.sidebar-link:hover {
  background: var(--paper-dim);
}
.sidebar-link:active {
  opacity: 0.7;
}"""
code = code.replace(old_sidebar_hover, new_sidebar_hover)

# Find .icon-btn:hover, add :active
old_icon_hover = """.icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}"""

new_icon_hover = """.icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}
.icon-btn:active {
  opacity: 0.6;
}"""
code = code.replace(old_icon_hover, new_icon_hover)

# Group hub cards
old_group_hub = """.group-hub-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.group-hub-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}"""

new_group_hub = """.group-hub-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.group-hub-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.group-hub-card:active {
  transform: translateY(0) scale(0.98);
  opacity: 0.8;
}"""
code = code.replace(old_group_hub, new_group_hub)

with open("app/static/style.css", "w") as f:
    f.write(code)
