import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SyncBundle } from '../lib/api/protection-types';
import { AppLockBridge } from '../services/AppLockBridge';
import { syncNativeLockState } from '../services/syncNativeLockState';
import type { LockedApp } from '../types';

interface LockingState {
  // Backend sync snapshot
  syncBundle: SyncBundle | null;
  protectionActive: boolean;
  onboardingComplete: boolean;
  starBalance: number;
  defaultRule: { starsRequired: number; minutesGranted: number } | null;

  // Device-local lock map (mirrors native)
  lockedApps: Record<string, LockedApp>;

  // Actions
  applySyncBundle: (bundle: SyncBundle) => Promise<void>;
  setProtectionActiveLocal: (active: boolean) => Promise<void>;
  setLockedApps: (apps: Record<string, LockedApp>) => void;
  hydrateFromCache: (bundle: SyncBundle) => void;
}

function sessionsToLockedApps(bundle: SyncBundle): Record<string, LockedApp> {
  const map: Record<string, LockedApp> = {};
  const now = Date.now();

  for (const app of bundle.protectedApps) {
    const session = bundle.activeSessions.find(
      (s) => s.packageName === app.packageName && s.status === 'ACTIVE',
    );
    const expiresAt = session ? new Date(session.endTime).getTime() : null;
    const isActive = expiresAt !== null && expiresAt > now;

    map[app.packageName] = {
      packageName: app.packageName,
      appName: app.appLabel ?? app.packageName,
      icon: null,
      status: isActive ? 'timer-unlocked' : 'locked',
      unlockExpiresAt: isActive ? expiresAt : null,
      grantedMinutes: session?.minutesGranted ?? null,
      todayUsageSeconds: 0,
      lockedAt: now,
    };
  }
  return map;
}

export const useLockingStore = create<LockingState>()(
  persist(
    (set, get) => ({
      syncBundle: null,
      protectionActive: false,
      onboardingComplete: false,
      starBalance: 0,
      defaultRule: null,
      lockedApps: {},

      hydrateFromCache: (bundle) => {
        const onboardingComplete = bundle.onboardingComplete || get().onboardingComplete;
        set({
          syncBundle: { ...bundle, onboardingComplete },
          protectionActive: bundle.protectionActive,
          onboardingComplete,
          starBalance: bundle.child.stars,
          defaultRule: bundle.defaultRule,
          lockedApps: sessionsToLockedApps(bundle),
        });
      },

      applySyncBundle: async (bundle) => {
        const lockedApps = sessionsToLockedApps(bundle);
        // Never regress onboardingComplete — stale sync/cache must not send user back to step 1.
        const onboardingComplete = bundle.onboardingComplete || get().onboardingComplete;
        const mergedBundle = { ...bundle, onboardingComplete };
        set({
          syncBundle: mergedBundle,
          protectionActive: bundle.protectionActive,
          onboardingComplete,
          starBalance: bundle.child.stars,
          defaultRule: bundle.defaultRule,
          lockedApps,
        });

        // Push config to native layer — always register protected apps on device
        await AppLockBridge.syncLockConfig({
          protectionActive: bundle.protectionActive,
          starBalance: bundle.child.stars,
          starsRequired: bundle.defaultRule?.starsRequired ?? 20,
          minutesGranted: bundle.defaultRule?.minutesGranted ?? 10,
          protectedPackages: bundle.protectedApps.filter((a) => a.enabled).map((a) => a.packageName),
        });

        if (Object.keys(lockedApps).length > 0) {
          await syncNativeLockState(lockedApps);
        }
        if (bundle.protectionActive && bundle.protectedApps.some((a) => a.enabled)) {
          await AppLockBridge.startForegroundService();
        }
      },

      setProtectionActiveLocal: async (active) => {
        set({ protectionActive: active });
        const { lockedApps, syncBundle, starBalance, defaultRule } = get();
        await AppLockBridge.syncLockConfig({
          protectionActive: active,
          starBalance: syncBundle?.child.stars ?? starBalance,
          starsRequired: defaultRule?.starsRequired ?? syncBundle?.defaultRule?.starsRequired ?? 20,
          minutesGranted: defaultRule?.minutesGranted ?? syncBundle?.defaultRule?.minutesGranted ?? 10,
          protectedPackages: (syncBundle?.protectedApps ?? [])
            .filter((a) => a.enabled)
            .map((a) => a.packageName),
        });
        await AppLockBridge.setProtectionActive(active);
        if (Object.keys(lockedApps).length > 0) {
          await syncNativeLockState(lockedApps);
          await AppLockBridge.startForegroundService();
        }
      },

      setLockedApps: (apps) => set({ lockedApps: apps }),
    }),
    {
      name: 'kiddy-locking-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        syncBundle: s.syncBundle,
        protectionActive: s.protectionActive,
        onboardingComplete: s.onboardingComplete,
        starBalance: s.starBalance,
        defaultRule: s.defaultRule,
        lockedApps: s.lockedApps,
      }),
    },
  ),
);
