with open("frontend/src/store/uiStore.ts", "r") as f:
    content = f.read()

content = content.replace("  isSettingsOpen: boolean;\n", "")
content = content.replace("  openSettings: () => void;\n", "")
content = content.replace("  closeSettings: () => void;\n", "")
content = content.replace("  isSettingsOpen: false,\n", "")
content = content.replace("  openSettings: () => set({ isSettingsOpen: true }),\n", "")
content = content.replace("  closeSettings: () => set({ isSettingsOpen: false }),\n", "")

with open("frontend/src/store/uiStore.ts", "w") as f:
    f.write(content)
