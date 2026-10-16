import type { SyncBundle } from '../lib/api/protection-types';
import { useLockingStore } from '../store/useLockingStore';
import { useChildStore } from '../store/useChildStore';
import { AppLockBridge } from './AppLockBridge';
import { deviceApi } from '../lib/deviceApi';
import { deviceStorage } from '../lib/deviceStorage';
import type { AgeGroup } from '../lib/api/types';

const SYNC_INTERVAL_MS = 60 * 1000; // 1 min — parent changes reach child quickly

let syncTimer: ReturnType<typeof setInterval> | null = null;

function childFromBundle(bundle: SyncBundle) {
  return {
    id: bundle.child.id,
    parentId: '',
    name: bundle.child.name,
    avatar: bundle.child.avatar,
    ageGroup: bundle.child.ageGroup as AgeGroup,
    stars: bundle.child.stars,
    xp: bundle.child.xp,
    level: bundle.child.level,
    currentStreak: bundle.child.currentStreak,
    bestStreak: 0,
    minutesEarned: bundle.child.minutesEarned,
    minutesSpent: bundle.child.minutesSpent,
    createdAt: '',
  };
}

/** Child-device sync — polls GET /device/sync and applies to useLockingStore. */
export const WlidiSync = {
  async pull(): Promise<SyncBundle> {
    console.log('[WlidiSync] pull');
    const bundle = await deviceApi.sync();
    await useLockingStore.getState().applySyncBundle(bundle);
    useChildStore.getState().setChild(childFromBundle(bundle));
    await deviceStorage.setChild({
      id: bundle.child.id,
      name: bundle.child.name,
      ageGroup: bundle.child.ageGroup,
      stars: bundle.child.stars,
    });
    return bundle;
  },

  async applyInitialBundle(bundle: SyncBundle) {
    await useLockingStore.getState().applySyncBundle(bundle);
    useChildStore.getState().setChild(childFromBundle(bundle));
    await deviceStorage.setChild({
      id: bundle.child.id,
      name: bundle.child.name,
      ageGroup: bundle.child.ageGroup,
      stars: bundle.child.stars,
    });
  },

  startPeriodicSync() {
    if (syncTimer) return;
    void WlidiSync.pull().catch((e) => console.warn('[WlidiSync] initial pull failed', e));
    syncTimer = setInterval(() => {
      void WlidiSync.pull().catch((e) => console.warn('[WlidiSync] periodic pull failed', e));
    }, SYNC_INTERVAL_MS);
  },

  /** Pull immediately when app returns to foreground (parent may have changed rules). */
  async pullOnForeground() {
    try {
      await WlidiSync.pull();
    } catch (e) {
      console.warn('[WlidiSync] foreground pull failed', e);
    }
  },

  stopPeriodicSync() {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  },

  async afterGameComplete() {
    try {
      await WlidiSync.pull();
    } catch (e) {
      console.warn('[WlidiSync] afterGameComplete failed', e);
    }
  },

  async spendAndUnlockApp(packageName: string, appLabel?: string) {
    const result = await deviceApi.autoUnlock(packageName, appLabel);
    const minutes = Math.max(1, Math.ceil(result.session.remainingSeconds / 60));
    await AppLockBridge.unlockApp(packageName, minutes);
    await WlidiSync.pull();
    await AppLockBridge.launchApp(packageName);
    return result;
  },
};
