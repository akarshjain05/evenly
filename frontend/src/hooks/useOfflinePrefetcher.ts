import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useGroups } from './useGroups';

export function useOfflinePrefetcher() {
  const queryClient = useQueryClient();
  const { data: groups } = useGroups();

  useEffect(() => {
    if (!groups || !navigator.onLine) return;

    const prefetchData = async () => {
      // Background prefetch all groups the user is a part of
      for (const m of groups) {
        const id = m.group.id;
        
        // Prefetch Group Details
        queryClient.prefetchQuery({
          queryKey: ['group', id],
          queryFn: async () => {
            const { data } = await apiClient.get(`groups/${id}`);
            return data;
          },
          staleTime: 1000 * 60 * 5, // 5 minutes fresh
        });

        // Prefetch Activity (First page only is enough for instant UI)
        queryClient.prefetchInfiniteQuery({
          queryKey: ['group-activity', id],
          queryFn: async () => {
            const { data } = await apiClient.get(`groups/${id}/activity?limit=20`);
            return data;
          },
          initialPageParam: undefined as string | undefined,
          staleTime: 1000 * 60 * 5,
        });
      }
    };

    // Give the main UI a moment to render before starting heavy background downloading
    const timer = setTimeout(() => {
      prefetchData();
    }, 2000);

    return () => clearTimeout(timer);
  }, [groups, queryClient]);
}
