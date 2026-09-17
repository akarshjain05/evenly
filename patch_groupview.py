import re

with open("frontend/src/pages/GroupView.tsx", "r") as f:
    content = f.read()

# Add uiStore methods to destructuring
content = content.replace(
    "const { openAddExpense, openSettleUp } = useUIStore();",
    "const { openAddExpense, openSettleUp, showAlert, showConfirm, showPrompt } = useUIStore();"
)

# Replace prompt
content = content.replace(
    'const newName = prompt("Enter new tab name:", group.name);',
    'const newName = await showPrompt("Rename Tab", group.name);'
)

# Replace alert for export
content = content.replace(
    "alert('Export failed');",
    "showAlert('Export failed');"
)
content = content.replace(
    "alert(\"Failed to rename tab.\");",
    "showAlert('Error', 'Failed to rename tab.');"
)
content = content.replace(
    'alert("Invite link copied to clipboard!");',
    'showAlert("Copied!", "Invite link copied to clipboard.");'
)

# Replace confirm
# the confirm is inside an onClick handler which is currently:
# onClick={() => { if (window.confirm('Delete this expense?')) { apiClient.delete... } }}
# We need to make it async:
# onClick={async () => { if (await showConfirm('Delete Expense?', 'Are you sure you want to delete this expense?', { danger: true })) { apiClient.delete... } }}
content = content.replace(
    "onClick={() => {\n                          if (window.confirm('Delete this expense?')) {",
    "onClick={async () => {\n                          if (await showConfirm('Delete Expense', 'Are you sure you want to delete this expense?', { danger: true })) {"
)

with open("frontend/src/pages/GroupView.tsx", "w") as f:
    f.write(content)

