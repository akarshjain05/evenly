import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}



export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiClient.get<CurrentUser>('users/me');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: options?.enabled
  });
}
