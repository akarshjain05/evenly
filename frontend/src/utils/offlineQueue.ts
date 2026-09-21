import { get, set } from 'idb-keyval';
import { apiClient } from '../api/client';

export interface OfflineAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
}

const QUEUE_KEY = 'offline-mutation-queue';

export const getOfflineQueue = async (): Promise<OfflineAction[]> => {
  return (await get(QUEUE_KEY)) || [];
};

export const addToOfflineQueue = async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
  const queue = await getOfflineQueue();
  const newAction: OfflineAction = {
    ...action,
    id: `temp-${Date.now()}`,
    timestamp: Date.now(),
  };
  await set(QUEUE_KEY, [...queue, newAction]);
  return newAction;
};

export const clearOfflineQueue = async () => {
  await set(QUEUE_KEY, []);
};

export const syncOfflineQueue = async (queryClient?: any) => {
  if (!navigator.onLine) return;
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;
  
  for (const action of queue) {
    try {
      if (action.method === 'POST') {
        await apiClient.post(action.url, action.data);
      } else if (action.method === 'PUT') {
        await apiClient.put(action.url, action.data);
      } else if (action.method === 'DELETE') {
        await apiClient.delete(action.url);
      }
    } catch (err) {
      console.error('Failed to sync offline action', action, err);
    }
  }
  
  await clearOfflineQueue();
  if (queryClient) {
    queryClient.invalidateQueries();
  }
};

window.addEventListener('online', syncOfflineQueue);
