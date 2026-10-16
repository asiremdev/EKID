import { api } from '../lib/api/client';
import type { ProtectedAppRecord, SyncBundle } from '../lib/api/protection-types';
import { useLockingStore } from '../store/useLockingStore';
import { useChildStore } from '../store/useChildStore';
import { AppLockBridge } from './AppLockBridge';
import { syncNativeLockState } from './syncNativeLockState';
import { prefStorage } from '../lib/storage';
import { isOnboardingCompleteLocal } from '../lib/onboarding';
import type { LockedApp } from '../types';

const CACHE_KEY = 'kiddy.sync.bundle';

function protectedAppsToLockedMap(
  apps: ProtectedAppRecord[],
  bundle?: SyncBundle | null,
): Record<string, LockedApp> {
  const map: Record<string, LockedApp> = {};
  const now = Date.now();
  for (const app of apps) {
    const session = bundle?.activeSessions?.find(
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

/** Unified sync between backend, Zustand, and native Android services. */
export const KiddySync = {
  /** Pull latest bundle from backend and push to all layers. */
  async pull(childId: string): Promise<SyncBundle> {
    console.log('[KiddySync] pull', childId);
    const bundle = await api.get<SyncBundle>(`/children/${childId}/protection/sync`);
    await useLockingStore.getState().applySyncBundle(bundle);
    useChildStore.getState().setChild({
      id: bundle.child.id,
      parentId: '',
      name: bundle.child.name,
      avatar: bundle.child.avatar,
      ageGroup: bundle.child.ageGroup as any,
      stars: bundle.child.stars,
      xp: bundle.child.xp,
      level: bundle.child.level,
      currentStreak: bundle.child.currentStreak,
      bestStreak: 0,
      minutesEarned: bundle.child.minutesEarned,
      minutesSpent: bundle.child.minutesSpent,
      createdAt: '',
    });
    await prefStorage.set(CACHE_KEY, JSON.stringify(bundle));
    console.log('[KiddySync] applied — stars:', bundle.child.stars, 'protection:', bundle.protectionActive);
    return bundle;
  },

  /** Save protected apps to backend and register locks on device immediately. */
  async saveProtectedApps(
    childId: string,
    apps: ProtectedAppRecord[],
  ): Promise<SyncBundle> {
    console.log('[KiddySync] saveProtectedApps', apps.length, 'apps');
    await api.put<ProtectedAppRecord[]>(`/children/${childId}/protection/apps`, { apps });

    let bundle: SyncBundle;
    try {
      bundle = await KiddySync.pull(childId);
    } catch (e) {
      console.warn('[KiddySync] pull after save failed, applying locally', e);
      const state = useLockingStore.getState();
      const localBundle: SyncBundle = {
        ...(state.syncBundle ?? {
          child: {
            id: childId,
            name: useChildStore.getState().child?.name ?? '',
            avatar: useChildStore.getState().child?.avatar ?? null,
            ageGroup: useChildStore.getState().child?.ageGroup ?? 'AGE_5_6',
            stars: state.starBalance,
            xp: 0,
            level: 1,
            currentStreak: 0,
            minutesEarned: 0,
            minutesSpent: 0,
          },
          protectionActive: state.protectionActive,
          onboardingComplete: state.onboardingComplete,
          rewardRules: [],
          defaultRule: state.defaultRule,
          activeSessions: [],
        }),
        protectedApps: apps,
      };
      await KiddySync.applyLocalBundle(localBundle);
      bundle = localBundle;
    }
    return bundle;
  },

  /** Push a bundle to Zustand + native without a network round-trip. */
  async applyLocalBundle(bundle: SyncBundle) {
    const lockedApps = protectedAppsToLockedMap(bundle.protectedApps, bundle);
    useLockingStore.getState().setLockedApps(lockedApps);
    useLockingStore.setState({
      syncBundle: bundle,
      starBalance: bundle.child.stars,
      defaultRule: bundle.defaultRule,
    });
    await AppLockBridge.syncLockConfig({
      protectionActive: bundle.protectionActive,
      starBalance: bundle.child.stars,
      starsRequired: bundle.defaultRule?.starsRequired ?? 20,
      minutesGranted: bundle.defaultRule?.minutesGranted ?? 10,
      protectedPackages: bundle.protectedApps.filter((a) => a.enabled).map((a) => a.packageName),
    });
    await syncNativeLockState(lockedApps);
    await AppLockBridge.startForegroundService();
  },

  /** Apply cached bundle when offline. */
  async applyCached(): Promise<SyncBundle | null> {
    const raw = await prefStorage.get(CACHE_KEY);
    if (!raw) return null;
    try {
      const bundle = JSON.parse(raw) as SyncBundle;
      const localDone = await isOnboardingCompleteLocal();
      if (localDone) bundle.onboardingComplete = true;
      await useLockingStore.getState().applySyncBundle(bundle);
      console.log('[KiddySync] offline cache applied');
      return bundle;
    } catch {
      return null;
    }
  },

  /** After activity completion — refresh stars and push to native immediately. */
  async afterStarsEarned(childId: string) {
    try {
      await KiddySync.pull(childId);
    } catch (e) {
      console.warn('[KiddySync] afterStarsEarned failed, using cache', e);
      await KiddySync.applyCached();
    }
  },

  /** Apply saved reward rules locally when sync pull fails (Neon cold start). */
  async applyRulesLocally(childId: string, rules: import('../lib/api/protection-types').RewardRuleRecord[]) {
    const state = useLockingStore.getState();
    const bundle = state.syncBundle;
    const defaultRule = rules.find((r) => r.isDefault) ?? rules[0] ?? null;
    const merged: import('../lib/api/protection-types').SyncBundle = {
      child: bundle?.child ?? {
        id: childId,
        name: useChildStore.getState().child?.name ?? '',
        avatar: useChildStore.getState().child?.avatar ?? null,
        ageGroup: (useChildStore.getState().child?.ageGroup as string) ?? 'AGE_5_6',
        stars: state.starBalance,
        xp: 0,
        level: 1,
        currentStreak: 0,
        minutesEarned: 0,
        minutesSpent: 0,
      },
      protectionActive: state.protectionActive,
      onboardingComplete: state.onboardingComplete,
      protectedApps: bundle?.protectedApps ?? [],
      rewardRules: rules,
      defaultRule: defaultRule
        ? { starsRequired: defaultRule.starsRequired, minutesGranted: defaultRule.minutesGranted }
        : null,
      activeSessions: bundle?.activeSessions ?? [],
    };
    await KiddySync.applyLocalBundle(merged);
  },

  /** Sync star balance to native after native optimistic unlock. */
  async syncStarBalance(stars: number) {
    const state = useLockingStore.getState();
    const bundle = state.syncBundle;
    if (!bundle) return;
    await AppLockBridge.syncLockConfig({
      protectionActive: state.protectionActive,
      starBalance: stars,
      starsRequired: bundle.defaultRule?.starsRequired ?? 20,
      minutesGranted: bundle.defaultRule?.minutesGranted ?? 10,
      protectedPackages: bundle.protectedApps.filter((a) => a.enabled).map((a) => a.packageName),
    });
    useLockingStore.setState({ starBalance: stars });
  },

  /** Attempt automatic unlock for a protected app (Learning → Stars → Unlock loop). */
  async autoUnlockApp(childId: string, packageName: string, appLabel?: string) {
    try {
      const result = await api.post<{
        session: { minutesGranted: number; packageName: string; remainingSeconds: number };
        starsRemaining: number;
      }>(`/children/${childId}/protection/auto-unlock`, { packageName, appLabel });

      const minutes = Math.max(1, Math.ceil(result.session.remainingSeconds / 60));
      await AppLockBridge.unlockApp(packageName, minutes);
      await KiddySync.pull(childId);
      console.log('[KiddySync] autoUnlock OK —', minutes, 'min, stars left:', result.starsRemaining);
      return { ok: true as const, result };
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      const code = e?.code ?? e?.details?.code;
      console.warn('[KiddySync] autoUnlock failed:', msg);
      if (code === 'INSUFFICIENT_STARS' || msg.includes('INSUFFICIENT') || msg.includes('Not enough stars')) {
        return { ok: false as const, reason: 'insufficient_stars' as const };
      }
      if (msg.includes('NetworkError') || msg.includes('Cannot reach')) {
        return { ok: false as const, reason: 'offline' as const };
      }
      return { ok: false as const, reason: 'error' as const, message: msg };
    }
  },

  /** Child confirms spending stars — unlock on server, native timer, then open the app. */
  async spendAndUnlockApp(childId: string, packageName: string, appLabel?: string) {
    console.log('[KiddySync] spendAndUnlock', packageName);
    const result = await KiddySync.autoUnlockApp(childId, packageName, appLabel);
    if (!result.ok) {
      throw new Error(result.reason ?? 'unlock_failed');
    }
    await AppLockBridge.launchApp(packageName);
    return result;
  },
};
