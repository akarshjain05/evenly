import re

with open("frontend/src/components/modals/SettingsModal.tsx", "r") as f:
    content = f.read()

# Add uiStore methods
content = content.replace(
    "const { isSettingsOpen, closeSettings } = useUIStore();",
    "const { isSettingsOpen, closeSettings, showAlert, showConfirm } = useUIStore();"
)

# Replace alerts
content = content.replace("alert('Push notifications are not supported in this browser.');", "showAlert('Error', 'Push notifications are not supported in this browser.');")
content = content.replace("alert('Notifications are already enabled. You can disable them in your browser settings.');", "showAlert('Info', 'Notifications are already enabled. You can disable them in your browser settings.');")
content = content.replace("alert('Notifications enabled successfully!');", "showAlert('Success', 'Notifications enabled successfully!');")
content = content.replace("alert('Notification permission was denied.');", "showAlert('Error', 'Notification permission was denied.');")
content = content.replace("alert('Failed to enable notifications: ' + err.message);", "showAlert('Error', 'Failed to enable notifications: ' + err.message);")

# Replace confirm
content = content.replace(
    "if (window.confirm('Are you sure you want to sign out?')) {",
    "if (await showConfirm('Sign Out', 'Are you sure you want to sign out?', { danger: true })) {"
)

# The sign out click handler is currently:
# onClick={() => { if (window.confirm...
# Needs to be async
content = content.replace(
    "onClick={() => {\n              if (await showConfirm('Sign Out'",
    "onClick={async () => {\n              if (await showConfirm('Sign Out'"
)

with open("frontend/src/components/modals/SettingsModal.tsx", "w") as f:
    f.write(content)
