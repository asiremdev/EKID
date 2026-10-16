import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppMode = 'unset' | 'parent' | 'child-device';

const MODE_KEY = 'wlidi.appMode';

interface AppModeState {
  mode: AppMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: Exclude<AppMode, 'unset'>) => Promise<void>;
  resetMode: () => Promise<void>;
}

export const useAppModeStore = create<AppModeState>((set) => ({
  mode: 'unset',
  hydrated: false,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(MODE_KEY);
    const mode: AppMode = raw === 'parent' || raw === 'child-device' ? raw : 'unset';
    set({ mode, hydrated: true });
  },

  setMode: async (mode) => {
    await AsyncStorage.setItem(MODE_KEY, mode);
    set({ mode });
  },

  resetMode: async () => {
    await AsyncStorage.removeItem(MODE_KEY);
    set({ mode: 'unset' });
  },
}));

export function isChildDeviceMode(mode: AppMode) {
  return mode === 'child-device';
}

export function isParentMode(mode: AppMode) {
  return mode === 'parent';
}
