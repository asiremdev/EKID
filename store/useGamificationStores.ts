import { create } from 'zustand';
import { Achievement, Challenge, StarTransaction, Unlock } from '../lib/api/types';

/**
 * Lightweight snapshot stores for server-driven domains. React Query owns
 * fetching/caching; these mirror the latest data so non-React code (e.g. the
 * lock overlay) and selectors can read synchronously.
 */

interface StarsState {
  balance: number;
  transactions: StarTransaction[];
  set: (balance: number, transactions?: StarTransaction[]) => void;
}
export const useStarsStore = create<StarsState>((set) => ({
  balance: 0,
  transactions: [],
  set: (balance, transactions) =>
    set((s) => ({ balance, transactions: transactions ?? s.transactions })),
}));

interface UnlocksState {
  active: Unlock[];
  set: (active: Unlock[]) => void;
}
export const useUnlocksStore = create<UnlocksState>((set) => ({
  active: [],
  set: (active) => set({ active }),
}));

interface ChallengesState {
  challenges: Challenge[];
  set: (challenges: Challenge[]) => void;
}
export const useChallengesStore = create<ChallengesState>((set) => ({
  challenges: [],
  set: (challenges) => set({ challenges }),
}));

interface AchievementsState {
  achievements: Achievement[];
  recentlyUnlocked: string[];
  set: (achievements: Achievement[]) => void;
  pushUnlocked: (codes: string[]) => void;
}
export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  achievements: [],
  recentlyUnlocked: [],
  set: (achievements) => set({ achievements }),
  pushUnlocked: (codes) => set({ recentlyUnlocked: [...get().recentlyUnlocked, ...codes] }),
}));
