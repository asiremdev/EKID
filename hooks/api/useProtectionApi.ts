import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import type {
  AutoUnlockResult,
  ProtectedAppRecord,
  RewardRuleRecord,
  SetupStatus,
  SyncBundle,
} from '../../lib/api/protection-types';
import { qk } from '../../lib/query/queryClient';
import { useLockingStore } from '../../store/useLockingStore';
import { useChildStore } from '../../store/useChildStore';
import { markOnboardingComplete } from '../../lib/onboarding';

export function useSetupStatus(enabled = true) {
  return useQuery({
    queryKey: ['setup-status'],
    queryFn: () => api.get<SetupStatus>('/parents/me/setup-status'),
    enabled,
  });
}

export function useMyChild() {
  const setChild = useChildStore((s) => s.setChild);
  return useQuery({
    queryKey: ['my-child'],
    queryFn: async () => {
      const child = await api.get<import('../../lib/api/types').Child | null>('/parents/me/child');
      if (child) setChild(child);
      return child;
    },
  });
}

export function useSyncBundle(childId: string | null) {
  const apply = useLockingStore((s) => s.applySyncBundle);
  return useQuery({
    queryKey: childId ? ['sync', childId] : ['sync', 'none'],
    queryFn: async () => {
      const bundle = await api.get<SyncBundle>(`/children/${childId}/protection/sync`);
      await apply(bundle);
      return bundle;
    },
    enabled: !!childId,
  });
}

export function useSetProtectionActive(childId: string) {
  const queryClient = useQueryClient();
  const setActive = useLockingStore((s) => s.setProtectionActiveLocal);
  return useMutation({
    mutationFn: (active: boolean) =>
      api.patch<{ protectionActive: boolean }>(`/children/${childId}/protection/active`, { active }),
    onSuccess: async (data) => {
      setActive(data.protectionActive);
      queryClient.invalidateQueries({ queryKey: ['sync', childId] });
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
    },
  });
}

export function useSyncProtectedApps(childId: string) {
  return useMutation({
    mutationFn: (apps: ProtectedAppRecord[]) =>
      api.put<ProtectedAppRecord[]>(`/children/${childId}/protection/apps`, { apps }),
  });
}

export function useSetRewardRules(childId: string) {
  return useMutation({
    mutationFn: (rules: Omit<RewardRuleRecord, 'id'>[]) =>
      api.put<RewardRuleRecord[]>(`/children/${childId}/protection/reward-rules`, { rules }),
  });
}

export function useCompleteOnboarding(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ onboardingComplete: boolean }>(`/children/${childId}/protection/complete-onboarding`),
    onSuccess: async () => {
      useLockingStore.setState({ onboardingComplete: true, protectionActive: true });
      await markOnboardingComplete();
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync', childId] });
    },
  });
}

export function useAutoUnlock(childId: string) {
  const apply = useLockingStore((s) => s.applySyncBundle);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { packageName: string; appLabel?: string }) =>
      api.post<AutoUnlockResult>(`/children/${childId}/protection/auto-unlock`, input),
    onSuccess: async () => {
      const bundle = await api.get<SyncBundle>(`/children/${childId}/protection/sync`);
      await apply(bundle);
      queryClient.invalidateQueries({ queryKey: qk.stars(childId) });
      queryClient.invalidateQueries({ queryKey: qk.child(childId) });
    },
  });
}
