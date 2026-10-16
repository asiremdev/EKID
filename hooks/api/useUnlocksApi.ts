import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { Unlock } from '../../lib/api/types';
import { qk } from '../../lib/query/queryClient';
import { useUnlocksStore } from '../../store/useGamificationStores';

export function useActiveUnlocks(childId: string | null) {
  const setUnlocks = useUnlocksStore((s) => s.set);
  return useQuery({
    queryKey: childId ? qk.unlocks(childId) : ['unlocks', 'none'],
    queryFn: async () => {
      const unlocks = await api.get<Unlock[]>(`/children/${childId}/unlocks`);
      setUnlocks(unlocks);
      return unlocks;
    },
    enabled: !!childId,
    refetchInterval: 30_000,
  });
}

export function useUnlockHistory(childId: string | null) {
  return useQuery({
    queryKey: childId ? ['unlocks', childId, 'history'] : ['unlocks', 'none', 'history'],
    queryFn: () => api.get<Unlock[]>(`/children/${childId}/unlocks/history`),
    enabled: !!childId,
  });
}

export function useCancelUnlock(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unlockId: string) => api.del(`/children/${childId}/unlocks/${unlockId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.unlocks(childId) }),
  });
}

export function useRecordUsage(childId: string) {
  return useMutation({
    mutationFn: (input: { appPackage: string; appLabel?: string; minutesUsed: number }) =>
      api.post(`/children/${childId}/unlocks/usage`, input),
  });
}
