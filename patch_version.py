import re

with open('app/main.py', 'r') as f:
    content = f.read()

content = content.replace('"version": "1.0.2"', '"version": "1.0.3"')

with open('app/main.py', 'w') as f:
    f.write(content)
