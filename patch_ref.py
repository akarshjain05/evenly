import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'ref={el => inputs.current[i] = el}',
    'ref={el => { inputs.current[i] = el; }}'
)

with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
