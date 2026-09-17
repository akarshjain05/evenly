with open("frontend/src/components/Layout.tsx", "r") as f:
    content = f.read()

# Add useNavigate
content = content.replace(
    "import { Outlet, Navigate } from 'react-router-dom';",
    "import { Outlet, Navigate, useNavigate } from 'react-router-dom';"
)

# Remove SettingsModal import
content = content.replace("import SettingsModal from './modals/SettingsModal';\n", "")
content = content.replace("import { useUIStore } from '../store/uiStore';\n", "")

# Change Layout component
content = content.replace("const { openSettings } = useUIStore();", "const navigate = useNavigate();")
content = content.replace("onClick={openSettings}", "onClick={() => navigate('/settings')}")
content = content.replace("<SettingsModal />\n", "")

with open("frontend/src/components/Layout.tsx", "w") as f:
    f.write(content)
