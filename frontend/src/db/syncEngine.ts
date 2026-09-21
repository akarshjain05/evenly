import { db } from './db';
import { apiClient } from '../api/client';

class SyncEngine {
  private isSyncing = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  async pull() {
    const meta = await db.syncMeta.get('last_synced_at');
    const since = meta?.value || null;
    
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    const { data } = await apiClient.get(`/sync${params}`);
    
    // Upsert all received data into local tables
    await db.transaction('rw', [db.groups, db.members, db.expenses, db.expenseSplits, db.settlements, db.syncMeta], async () => {
      if (data.groups?.length) await db.groups.bulkPut(data.groups);
      if (data.members?.length) await db.members.bulkPut(data.members);
      if (data.expenses?.length) await db.expenses.bulkPut(data.expenses);
      if (data.expense_splits?.length) await db.expenseSplits.bulkPut(data.expense_splits);
      if (data.settlements?.length) await db.settlements.bulkPut(data.settlements);
      if (data.server_timestamp) {
        await db.syncMeta.put({ key: 'last_synced_at', value: data.server_timestamp });
      }
    });
  }

  async push() {
    const pending = await db.pendingChanges.toArray();
    if (pending.length === 0) return;
    
    const mutations = pending.map(p => ({
      table: p.table,
      action: p.action,
      id: p.entity_id,
      group_id: p.group_id,
      data: p.data,
      client_updated_at: p.created_at
    }));
    
    try {
      await apiClient.post('/sync/push', { mutations });
      // Remove all pending changes that were processed (applied or rejected)
      
      // Clear all pending changes that were sent
      const idsToDelete = pending.map(p => p.id).filter((id): id is number => id !== undefined);
      if (idsToDelete.length > 0) {
        await db.pendingChanges.where('id').anyOf(idsToDelete).delete();
      }
    } catch (err) {
      console.error('Push sync failed, will retry:', err);
    }
  }

  async sync() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    try {
      await this.push();
      await this.pull();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  requestSync() {
    // Debounced non-blocking sync trigger
    setTimeout(() => this.sync(), 100);
  }

  start() {
    // Initial sync
    this.sync();
    // Periodic sync every 30 seconds
    this.intervalId = setInterval(() => this.sync(), 30000);
    // Sync on reconnect
    window.addEventListener('online', () => this.sync());
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async clearAll() {
    await db.delete();
    await db.open();
  }
}

export const syncEngine = new SyncEngine();
