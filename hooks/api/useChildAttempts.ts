import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { qk } from '../../lib/query/queryClient';

export interface ChildAttempt {
  id: string;
  status: string;
  score: number;
  starsEarned: number;
  xpEarned: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string | null;
  activity: { title: string; type: string; subject: string | null };
}

export function useChildAttempts(childId: string | null, limit = 10) {
  return useQuery({
    queryKey: childId ? [...qk.attempts(childId), limit] : ['attempts', 'none'],
    queryFn: () => api.get<ChildAttempt[]>(`/children/${childId}/attempts`),
    enabled: !!childId,
    select: (rows) => rows.filter((a) => a.status === 'COMPLETED').slice(0, limit),
  });
}
