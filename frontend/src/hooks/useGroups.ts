import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { MembershipResponse } from '../types/api';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data } = await apiClient.get<MembershipResponse[]>('users/me/groups');
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
