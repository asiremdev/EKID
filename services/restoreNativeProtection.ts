import { AppLockBridge } from './AppLockBridge';
import { syncNativeLockState } from './syncNativeLockState';
import { useLockingStore } from '../store/useLockingStore';

/** Push cached Zustand lock state to native immediately (before network sync). */
export async function restoreNativeProtection(): Promise<void> {
  const state = useLockingStore.getState();
  const bundle = state.syncBundle;
  if (!bundle?.protectedApps?.length) return;

  const lockedApps =
    Object.keys(state.lockedApps).length > 0
      ? state.lockedApps
      : bundle.protectedApps.reduce(
          (acc, app) => {
            acc[app.packageName] = {
              packageName: app.packageName,
              appName: app.appLabel ?? app.packageName,
              icon: null,
              status: 'locked' as const,
              unlockExpiresAt: null,
              grantedMinutes: null,
              todayUsageSeconds: 0,
              lockedAt: Date.now(),
            };
            return acc;
          },
          {} as typeof state.lockedApps,
        );

  const protectionActive = state.protectionActive || bundle.protectionActive;

  await AppLockBridge.syncLockConfig({
    protectionActive,
    starBalance: bundle.child.stars ?? state.starBalance,
    starsRequired: bundle.defaultRule?.starsRequired ?? state.defaultRule?.starsRequired ?? 20,
    minutesGranted: bundle.defaultRule?.minutesGranted ?? state.defaultRule?.minutesGranted ?? 10,
    protectedPackages: bundle.protectedApps.filter((a) => a.enabled).map((a) => a.packageName),
  });

  await syncNativeLockState(lockedApps);
  await AppLockBridge.startForegroundService();
}
