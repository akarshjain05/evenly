import re
with open("tests/test_api.py", "r") as f:
    content = f.read()

content = content.replace('res.json().get("access_token", res.json())', 'res.json()["access_token"]')
with open("tests/test_api.py", "w") as f:
    f.write(content)
