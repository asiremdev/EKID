import { create } from 'zustand';
import { Subscription } from '../lib/api/types';

interface SubscriptionState {
  subscription: Subscription | null;
  set: (subscription: Subscription | null) => void;
  trialDaysLeft: () => number;
  isLocked: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  set: (subscription) => set({ subscription }),

  trialDaysLeft: () => {
    const sub = get().subscription;
    if (!sub || sub.status !== 'TRIAL') return 0;
    const ms = new Date(sub.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 86_400_000));
  },

  /** Premium features are locked when neither a trial nor an active plan is valid. */
  isLocked: () => {
    const sub = get().subscription;
    if (!sub) return false; // unknown yet — don't hard-block
    return !sub.isActive;
  },
}));
