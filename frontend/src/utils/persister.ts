import { get, set, del } from 'idb-keyval';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

export const createIDBPersister = (idbValidKey: string = 'reactQuery'): Persister => {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(idbValidKey, client);
      } catch (err) {
        console.warn('Could not persist React Query cache', err);
      }
    },
    restoreClient: async () => {
      try {
        return await get<PersistedClient>(idbValidKey);
      } catch (err) {
        console.warn('Could not restore React Query cache', err);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(idbValidKey);
      } catch (err) {
        console.warn('Could not remove React Query cache', err);
      }
    },
  };
};
