import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { qk } from '../../lib/query/queryClient';

export interface AnalyticsOverview {
  dau: number;
  wau: number;
  completionRate: number;
  totals: {
    activitiesStarted: number;
    activitiesCompleted: number;
    starsEarned: number;
    minutesUnlocked: number;
  };
  daily: { day: string; activitiesCompleted: number; starsEarned: number }[];
}

export function useAnalyticsOverview(days = 7) {
  return useQuery({
    queryKey: [...qk.analytics, days],
    queryFn: () => api.get<AnalyticsOverview>('/analytics/overview', { days }),
  });
}
