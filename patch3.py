with open("tests/test_api.py", "r") as f:
    content = f.read()

import_lines = "import pytest\nfrom app import rate_limiter\n\n@pytest.fixture(autouse=True)\ndef clear_rate_limits():\n    rate_limiter._auth_attempts.clear()\n\n"
if "import pytest" not in content:
    content = import_lines + content

with open("tests/test_api.py", "w") as f:
    f.write(content)
