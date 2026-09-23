import re

with open('frontend/src/pages/JoinGroupPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { Loader2 } from 'lucide-react';",
    "import { Loader2 } from 'lucide-react';\nimport { db } from '../db/db';\nimport { syncEngine } from '../db/syncEngine';"
)

old_try = """        try {
          await apiClient.post(`/groups/by-code/${code}/join`, {});
          queryClient.invalidateQueries({ queryKey: ['groups'] });
          navigate(`/group/${groupId}`, { replace: true });
        } catch (joinErr: any) {"""

new_try = """        try {
          const res = await apiClient.post(`/groups/by-code/${code}/join`, {});
          
          // Clear sync meta so we fetch the full history of the new group
          await db.syncMeta.delete('last_synced_at');
          
          if (res.data?.group && res.data?.member) {
            await db.transaction('rw', [db.groups, db.members], async () => {
              await db.groups.put({ ...res.data.group, updated_at: new Date().toISOString() });
              await db.members.put({ ...res.data.member, updated_at: new Date().toISOString() });
            }).catch(console.error);
          }
          
          queryClient.invalidateQueries({ queryKey: ['groups'] });
          navigate(`/group/${groupId}`, { replace: true });
          syncEngine.sync();
        } catch (joinErr: any) {"""

content = content.replace(old_try, new_try)

with open('frontend/src/pages/JoinGroupPage.tsx', 'w') as f:
    f.write(content)
