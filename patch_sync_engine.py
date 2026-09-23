import re

with open('frontend/src/db/syncEngine.ts', 'r') as f:
    content = f.read()

old_push = """      await apiClient.post('/sync/push', { mutations });
      const pushedIds = new Set(pending.map(p => p.id));
      await db.pendingChanges.where('id').anyOf([...pushedIds]).delete();"""

new_push = """      const res = await apiClient.post('/sync/push', { mutations });
      const applied = res.data?.applied || [];
      const rejected = res.data?.rejected || [];
      
      if (rejected.length > 0) {
        console.warn('Backend rejected these mutations:', rejected);
      }
      
      // Delete everything we pushed from pending queue (even rejected ones, 
      // so we don't get stuck in an infinite crash loop blocking other changes).
      // If they were rejected, they are unfortunately orphaned locally.
      const pushedIds = new Set(pending.map(p => p.id));
      await db.pendingChanges.where('id').anyOf([...pushedIds]).delete();"""

content = content.replace(old_push, new_push)

with open('frontend/src/db/syncEngine.ts', 'w') as f:
    f.write(content)
