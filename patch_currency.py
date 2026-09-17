import re

with open("frontend/src/pages/GroupView.tsx", "r") as f:
    content = f.read()

# Replace $ with ₹ ONLY if it is not followed by {
content = re.sub(r'\$(?!\{)', '₹', content)

with open("frontend/src/pages/GroupView.tsx", "w") as f:
    f.write(content)
