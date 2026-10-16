import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Child } from '../lib/api/types';

/** Phase 2C: ONE child per parent — no multi-select. */
interface ChildState {
  child: Child | null;
  setChild: (child: Child | null) => void;
  hydrateSelection: () => Promise<void>;
}

export const useChildStore = create<ChildState>()(
  persist(
    (set) => ({
      child: null,

      setChild: (child) => set({ child }),

      hydrateSelection: async () => {
        /* rehydrated from persist */
      },
    }),
    {
      name: 'kiddy-child-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ child: s.child }),
    },
  ),
);

/** Convenience selector for the single child. */
export function useSelectedChild() {
  return useChildStore((s) => s.child);
}
