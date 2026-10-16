import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppLockStore,
  InstalledApp,
  LockedApp,
  ForegroundAppEvent,
  PermissionsStatus,
} from '../types';
import { AppLockBridge } from '../services/AppLockBridge';

const DEFAULT_PERMISSIONS: PermissionsStatus = {
  usageStatsAccess: 'unknown',
  accessibilityService: 'unknown',
  displayOverOtherApps: 'unknown',
  batteryOptimizationIgnored: 'unknown',
  notificationPermission: 'unknown',
};

function stripIconsFromPersisted(raw: string | null): string | null {
  if (!raw) return raw;
  try {
    const parsed = JSON.parse(raw) as { state?: { lockedApps?: Record<string, LockedApp> } };
    const locked = parsed?.state?.lockedApps;
    if (!locked) return raw;
    let changed = false;
    for (const pkg of Object.keys(locked)) {
      if (locked[pkg]?.icon) {
        locked[pkg] = { ...locked[pkg], icon: null };
        changed = true;
      }
    }
    return changed ? JSON.stringify(parsed) : raw;
  } catch {
    return raw;
  }
}

const kiddyStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const raw = await AsyncStorage.getItem(name);
    return stripIconsFromPersisted(raw);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};

export const useAppLockStore = create<AppLockStore>()(
  persist(
    (set, get) => ({
      installedApps: [],
      lockedApps: {},
      foregroundApp: null,
      permissionsStatus: DEFAULT_PERMISSIONS,
      isServiceRunning: false,
      isLoading: false,
      error: null,

      loadInstalledApps: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const apps = await AppLockBridge.getInstalledApps();
          set({ installedApps: apps, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load apps',
            isLoading: false,
          });
        }
      },

      lockApp: async (app: InstalledApp) => {
        try {
          await AppLockBridge.lockApp(app.packageName);
          if (!get().isServiceRunning) {
            try {
              await AppLockBridge.startForegroundService();
              set({ isServiceRunning: true });
            } catch {
              // Service may still start from native lockApp
            }
          }
          const lockedApp: LockedApp = {
            packageName: app.packageName,
            appName: app.appName,
            icon: null,
            status: 'locked',
            unlockExpiresAt: null,
            grantedMinutes: null,
            todayUsageSeconds: 0,
            lockedAt: Date.now(),
          };
          set((state) => ({
            lockedApps: { ...state.lockedApps, [app.packageName]: lockedApp },
          }));
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to lock app' });
        }
      },

      unlockApp: async (packageName: string, minutes: number) => {
        try {
          await AppLockBridge.unlockApp(packageName, minutes);
          const expiresAt = Date.now() + minutes * 60 * 1000;
          set((state) => {
            const existing = state.lockedApps[packageName];
            if (!existing) return state;
            return {
              lockedApps: {
                ...state.lockedApps,
                [packageName]: {
                  ...existing,
                  status: 'timer-unlocked',
                  unlockExpiresAt: expiresAt,
                  grantedMinutes: minutes,
                },
              },
            };
          });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to unlock app' });
        }
      },

      relockApp: async (packageName: string) => {
        try {
          await AppLockBridge.lockApp(packageName);
          set((state) => {
            const existing = state.lockedApps[packageName];
            if (!existing) return state;
            return {
              lockedApps: {
                ...state.lockedApps,
                [packageName]: {
                  ...existing,
                  status: 'locked',
                  unlockExpiresAt: null,
                  grantedMinutes: null,
                },
              },
            };
          });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to relock app' });
        }
      },

      removeFromLocked: (packageName: string) => {
        AppLockBridge.removeAppFromLock(packageName).catch(() => {});
        set((state) => {
          const { [packageName]: _removed, ...remaining } = state.lockedApps;
          return { lockedApps: remaining };
        });
      },

      setForegroundApp: (event: ForegroundAppEvent) => {
        const current = get().foregroundApp;
        if (current?.packageName === event.packageName) return;
        set({ foregroundApp: event });
      },

      updateRemainingTime: () => {
        // Timer display handled locally in components — no store updates per tick
      },

      handleTimerExpired: (packageName: string) => {
        set((state) => {
          const app = state.lockedApps[packageName];
          if (!app || app.status !== 'timer-unlocked') return state;
          return {
            lockedApps: {
              ...state.lockedApps,
              [packageName]: {
                ...app,
                status: 'locked',
                unlockExpiresAt: null,
                grantedMinutes: null,
              },
            },
          };
        });
      },

      refreshPermissions: async () => {
        try {
          const perms = await AppLockBridge.checkPermissions();
          const current = get().permissionsStatus;
          const changed = (Object.keys(perms) as (keyof PermissionsStatus)[]).some(
            (k) => current[k] !== perms[k]
          );
          if (changed) set({ permissionsStatus: perms });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to check permissions' });
        }
      },

      startMonitoring: async () => {
        if (get().isServiceRunning) return;
        try {
          await AppLockBridge.startForegroundService();
          set({ isServiceRunning: true });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to start monitoring' });
        }
      },

      stopMonitoring: async () => {
        try {
          await AppLockBridge.stopForegroundService();
          await AppLockBridge.stopWatchingForegroundApp();
          set({ isServiceRunning: false, foregroundApp: null });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to stop monitoring' });
        }
      },

      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'kiddy-app-lock-store',
      storage: createJSONStorage(() => kiddyStorage),
      partialize: (state) => ({ lockedApps: state.lockedApps }),
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppLockStore> | undefined;
        if (!saved?.lockedApps) return current;
        const lockedApps: Record<string, LockedApp> = {};
        for (const [pkg, app] of Object.entries(saved.lockedApps)) {
          lockedApps[pkg] = { ...app, icon: null };
        }
        return { ...current, lockedApps };
      },
    }
  )
);

/** Stable hook — avoids infinite loop from Object.values() creating new arrays */
export function useLockedAppsList() {
  return useAppLockStore(
    useShallow((s) => Object.values(s.lockedApps))
  );
}

export function useLockedAppsCount() {
  return useAppLockStore((s) => Object.keys(s.lockedApps).length);
}

export function usePermissionsStatus() {
  return useAppLockStore((s) => s.permissionsStatus);
}

/** Stable set of locked package names — avoids re-rendering whole app lists */
export function useLockedPackageNames() {
  return useAppLockStore(useShallow((s) => Object.keys(s.lockedApps)));
}

export const selectAllPermissionsGranted = (state: AppLockStore) => {
  const p = state.permissionsStatus;
  return (
    p.usageStatsAccess === 'granted' &&
    p.accessibilityService === 'granted' &&
    p.displayOverOtherApps === 'granted' &&
    p.batteryOptimizationIgnored === 'granted' &&
    p.notificationPermission === 'granted'
  );
};
