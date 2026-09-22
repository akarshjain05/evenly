with open("frontend/src/pages/GroupView.tsx", "r") as f:
    content = f.read()

# Remove the faulty useMemo definition
faulty_use_memo = "  const currentMember = React.useMemo(() => group?.members.find(m => m.user_id === user?.id), [group, user]);"
content = content.replace(faulty_use_memo, "")

# Find the start of the component to insert the useMemo properly
hook_target = "const activeItems = activeActivityTab === 'expenses' ? expenses : settlements;"
fixed_use_memo = "const currentMember = useMemo(() => group?.members.find(m => m.user_id === user?.id), [group, user]);"

content = content.replace(
    hook_target,
    f"{hook_target}\n  {fixed_use_memo}"
)

with open("frontend/src/pages/GroupView.tsx", "w") as f:
    f.write(content)
