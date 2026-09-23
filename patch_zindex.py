import re

with open('frontend/src/pages/GroupView.tsx', 'r') as f:
    content = f.read()

old_style = """                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start - parentOffset}px)`,
                          }}"""

new_style = """                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start - parentOffset}px)`,
                            zIndex: openMenuId === item.id ? 50 : 1,
                          }}"""

content = content.replace(old_style, new_style)

with open('frontend/src/pages/GroupView.tsx', 'w') as f:
    f.write(content)
