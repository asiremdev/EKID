import { AppLockBridge } from './AppLockBridge';
import type { LockedApp } from '../types';

/** Push persisted JS lock state into the native ConcurrentHashMap after app restart */
export async function syncNativeLockState(lockedApps: Record<string, LockedApp>): Promise<void> {
  const entries = Object.entries(lockedApps);
  for (const [packageName, app] of entries) {
    try {
      if (app.status === 'timer-unlocked' && app.unlockExpiresAt) {
        const remainingMs = app.unlockExpiresAt - Date.now();
        if (remainingMs > 1000) {
          const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
          await AppLockBridge.unlockApp(packageName, minutes);
        } else {
          await AppLockBridge.lockApp(packageName);
        }
      } else {
        await AppLockBridge.lockApp(packageName);
      }
    } catch {
      // Continue syncing other apps
    }
  }

  if (entries.length > 0) {
    try {
      await AppLockBridge.startForegroundService();
    } catch {
      // Native lockApp calls also ensure the service is running
    }
  }
}
