import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { Activity, AgeGroup, AttemptResult, Paginated } from '../../lib/api/types';
import { qk } from '../../lib/query/queryClient';

export interface ActivityQuery {
  ageGroup?: AgeGroup;
  type?: string;
  subject?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useActivities(params: ActivityQuery) {
  return useQuery({
    queryKey: qk.activities(params as Record<string, unknown>),
    queryFn: () =>
      api.get<Paginated<Activity>>(
        '/activities',
        {
          ageGroup: params.ageGroup,
          type: params.type,
          subject: params.subject,
          search: params.search,
          page: params.page ?? 1,
          limit: params.limit ?? 30,
        },
        false,
      ),
  });
}

export function useActivity(id: string | null) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => api.get<Activity>(`/activities/${id}`, undefined, false),
    enabled: !!id,
  });
}

export function useStartAttempt(childId: string) {
  return useMutation({
    mutationFn: (activityId: string) =>
      api.post<{ id: string }>(`/children/${childId}/attempts/activities/${activityId}/start`),
  });
}

export function useCompleteAttempt(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      attemptId: string;
      score: number;
      durationSeconds?: number;
      answers?: Record<string, unknown>;
    }) =>
      api.post<AttemptResult>(`/children/${childId}/attempts/${input.attemptId}/complete`, {
        score: input.score,
        durationSeconds: input.durationSeconds,
        answers: input.answers,
      }),
    onSuccess: () => {
      // Reward flow changed stars/xp/streak/achievements — refresh the child views.
      queryClient.invalidateQueries({ queryKey: qk.child(childId) });
      queryClient.invalidateQueries({ queryKey: qk.childStats(childId) });
      queryClient.invalidateQueries({ queryKey: qk.stars(childId) });
      queryClient.invalidateQueries({ queryKey: qk.xp(childId) });
      queryClient.invalidateQueries({ queryKey: qk.streak(childId) });
      queryClient.invalidateQueries({ queryKey: qk.challenges(childId) });
      queryClient.invalidateQueries({ queryKey: qk.achievements(childId) });
      queryClient.invalidateQueries({ queryKey: qk.children });
    },
  });
}
