import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { Plan, Subscription } from '../../lib/api/types';
import { qk } from '../../lib/query/queryClient';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';

export function usePlans() {
  return useQuery({
    queryKey: qk.plans,
    queryFn: () => api.get<Plan[]>('/subscriptions/plans', undefined, false),
    staleTime: 60 * 60_000,
  });
}

export function useSubscription() {
  const setSub = useSubscriptionStore((s) => s.set);
  return useQuery({
    queryKey: qk.subscription,
    queryFn: async () => {
      const sub = await api.get<Subscription>('/subscriptions/me');
      setSub(sub);
      return sub;
    },
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (plan: string) =>
      api.post<{ checkoutUrl?: string; providerRef: string; provider: string }>(
        '/subscriptions/checkout',
        { plan },
      ),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/subscriptions/cancel'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.subscription }),
  });
}
