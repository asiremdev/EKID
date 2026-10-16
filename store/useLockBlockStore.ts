import { create } from 'zustand';

export type LockBlockReason = 'insufficient_stars' | 'time_expired' | 'ready_to_unlock';

export interface LockBlockPayload {
  packageName: string;
  appLabel: string;
  reason: LockBlockReason;
  currentStars: number;
  requiredStars: number;
}

interface LockBlockState {
  visible: boolean;
  payload: LockBlockPayload | null;
  show: (payload: LockBlockPayload) => void;
  updateStars: (currentStars: number) => void;
  dismiss: () => void;
}

export const useLockBlockStore = create<LockBlockState>((set) => ({
  visible: false,
  payload: null,
  show: (payload) =>
    set((state) => ({
      visible: true,
      payload: {
        ...payload,
        // Keep overlay open — refresh stars/reason but never hide accidentally.
        currentStars: payload.currentStars ?? state.payload?.currentStars ?? 0,
      },
    })),
  updateStars: (currentStars) =>
    set((state) =>
      state.payload ? { payload: { ...state.payload, currentStars } } : state,
    ),
  dismiss: () => set({ visible: false, payload: null }),
}));
