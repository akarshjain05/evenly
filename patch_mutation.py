import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'mutationFn: async () => {',
    'mutationFn: async (overrideCode?: string | void | React.MouseEvent | React.FormEvent) => {'
)

content = content.replace(
    'return apiClient.post(`groups/by-code/${encodeURIComponent(inviteCode)}/join`, {});',
    '''const codeToUse = typeof overrideCode === 'string' ? overrideCode : inviteCode;
        return apiClient.post(`groups/by-code/${encodeURIComponent(codeToUse)}/join`, {});'''
)

with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
