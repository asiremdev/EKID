import { create } from 'zustand';
import { AttemptResult } from '../lib/api/types';

export interface RewardPayload {
  starsEarned: number;
  xpEarned: number;
  leveledUp: boolean;
  newLevel?: number;
  streak?: number;
  milestone?: number | null;
  unlockedAchievements?: { code: string; title: string }[];
}

interface RewardState {
  visible: boolean;
  reward: RewardPayload | null;
  showFromAttempt: (result: AttemptResult, previousLevel: number) => void;
  show: (reward: RewardPayload) => void;
  dismiss: () => void;
}

export const useRewardStore = create<RewardState>((set) => ({
  visible: false,
  reward: null,

  showFromAttempt: (result, previousLevel) =>
    set({
      visible: true,
      reward: {
        starsEarned: result.starsEarned,
        xpEarned: result.xpEarned,
        leveledUp: result.level > previousLevel,
        newLevel: result.level,
        streak: result.streak?.currentStreak,
        milestone: result.streak?.nextMilestone,
        unlockedAchievements: result.unlockedAchievements,
      },
    }),

  show: (reward) => set({ visible: true, reward }),
  dismiss: () => set({ visible: false, reward: null }),
}));
