import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { StarTransaction, Unlock } from '../../lib/api/types';
import { qk } from '../../lib/query/queryClient';
import { useStarsStore } from '../../store/useGamificationStores';

export function useStarBalance(childId: string | null) {
  const setStars = useStarsStore((s) => s.set);
  return useQuery({
    queryKey: childId ? qk.stars(childId) : ['stars', 'none'],
    queryFn: async () => {
      const res = await api.get<{ balance: number }>(`/children/${childId}/stars/balance`);
      setStars(res.balance);
      return res;
    },
    enabled: !!childId,
  });
}

export function useStarTransactions(childId: string | null) {
  return useQuery({
    queryKey: childId ? qk.starTx(childId) : ['stars', 'none', 'tx'],
    queryFn: () => api.get<StarTransaction[]>(`/children/${childId}/stars/transactions`),
    enabled: !!childId,
  });
}

function invalidateStars(queryClient: ReturnType<typeof useQueryClient>, childId: string) {
  queryClient.invalidateQueries({ queryKey: qk.stars(childId) });
  queryClient.invalidateQueries({ queryKey: qk.starTx(childId) });
  queryClient.invalidateQueries({ queryKey: qk.child(childId) });
}

export function useEarnStars(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; reason: string }) =>
      api.post(`/children/${childId}/stars/earn`, input),
    onSuccess: () => invalidateStars(queryClient, childId),
  });
}

export function useSpendStars(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; reason: string }) =>
      api.post(`/children/${childId}/stars/spend`, input),
    onSuccess: () => invalidateStars(queryClient, childId),
  });
}

export function useTransferStars(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { toChildId: string; amount: number; reason?: string }) =>
      api.post(`/children/${childId}/stars/transfer`, input),
    onSuccess: () => invalidateStars(queryClient, childId),
  });
}

export function useUnlockAppTime(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { appPackage: string; appLabel?: string; minutes: number }) =>
      api.post<Unlock>(`/children/${childId}/stars/unlock`, input),
    onSuccess: () => {
      invalidateStars(queryClient, childId);
      queryClient.invalidateQueries({ queryKey: qk.unlocks(childId) });
    },
  });
}
