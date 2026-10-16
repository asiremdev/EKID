import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Don't retry auth/client errors; retry transient/server errors up to 2x.
        if (error instanceof ApiError && error.statusCode < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Centralized query keys to keep cache invalidation consistent. */
export const qk = {
  me: ['me'] as const,
  subscription: ['subscription'] as const,
  plans: ['plans'] as const,
  children: ['children'] as const,
  child: (id: string) => ['child', id] as const,
  childStats: (id: string) => ['child', id, 'stats'] as const,
  activities: (params: Record<string, unknown>) => ['activities', params] as const,
  attempts: (childId: string) => ['attempts', childId] as const,
  stars: (childId: string) => ['stars', childId] as const,
  starTx: (childId: string) => ['stars', childId, 'tx'] as const,
  xp: (childId: string) => ['xp', childId] as const,
  streak: (childId: string) => ['streak', childId] as const,
  unlocks: (childId: string) => ['unlocks', childId] as const,
  challenges: (childId: string) => ['challenges', childId] as const,
  achievements: (childId: string) => ['achievements', childId] as const,
  analytics: ['analytics'] as const,
};
