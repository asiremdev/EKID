import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api/client';
import { Achievement, Challenge, LevelProgress } from '../../lib/api/types';
import { qk } from '../../lib/query/queryClient';
import { useAchievementsStore, useChallengesStore } from '../../store/useGamificationStores';

// ─── XP / Level ────────────────────────────────────────────────────────────────
export function useXpProgress(childId: string | null) {
  return useQuery({
    queryKey: childId ? qk.xp(childId) : ['xp', 'none'],
    queryFn: () => api.get<LevelProgress>(`/children/${childId}/xp/progress`),
    enabled: !!childId,
  });
}

// ─── Streak ────────────────────────────────────────────────────────────────────
export function useStreak(childId: string | null) {
  return useQuery({
    queryKey: childId ? qk.streak(childId) : ['streak', 'none'],
    queryFn: () =>
      api.get<{ currentStreak: number; bestStreak: number; nextMilestone: number | null; milestones: number[] }>(
        `/children/${childId}/streak`,
      ),
    enabled: !!childId,
  });
}

// ─── Challenges ──────────────────────────────────────────────────────────────────
export function useChallenges(childId: string | null) {
  const setChallenges = useChallengesStore((s) => s.set);
  return useQuery({
    queryKey: childId ? qk.challenges(childId) : ['challenges', 'none'],
    queryFn: async () => {
      const challenges = await api.get<Challenge[]>(`/children/${childId}/challenges`);
      setChallenges(challenges);
      return challenges;
    },
    enabled: !!childId,
  });
}

export function useClaimChallenge(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) =>
      api.post<{ success: boolean; starsReward: number; xpReward: number }>(
        `/children/${childId}/challenges/${challengeId}/claim`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.challenges(childId) });
      queryClient.invalidateQueries({ queryKey: qk.stars(childId) });
      queryClient.invalidateQueries({ queryKey: qk.child(childId) });
    },
  });
}

// ─── Achievements ────────────────────────────────────────────────────────────────
export function useAchievements(childId: string | null) {
  const setAchievements = useAchievementsStore((s) => s.set);
  return useQuery({
    queryKey: childId ? qk.achievements(childId) : ['achievements', 'none'],
    queryFn: async () => {
      const achievements = await api.get<Achievement[]>(`/children/${childId}/achievements`);
      setAchievements(achievements);
      return achievements;
    },
    enabled: !!childId,
  });
}
