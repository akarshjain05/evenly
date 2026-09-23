import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

old_on_success = """    onSuccess: async (res) => {
      // Trigger a sync so the new group is pulled into local Dexie DB
      await syncEngine.sync();
      
      const groupId = res.data.group?.id || res.data.group_id;
      if (groupId) {
        navigate(`/group/${groupId}`);
      }
    },"""

new_on_success = """    onSuccess: async (res) => {
      const groupId = res.data.group?.id || res.data.group_id;
      if (groupId) {
        if (res.data.group && res.data.member) {
          import('../db/db').then(({ db }) => {
            db.transaction('rw', [db.groups, db.members], async () => {
              await db.groups.put({ ...res.data.group, updated_at: new Date().toISOString() });
              await db.members.put({ ...res.data.member, updated_at: new Date().toISOString() });
            }).catch(console.error);
          });
        }
        navigate(`/group/${groupId}`);
      }
      syncEngine.sync();
    },"""

content = content.replace(old_on_success, new_on_success)

with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
