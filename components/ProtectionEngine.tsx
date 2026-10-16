import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { AppLockBridge } from '../services/AppLockBridge';
import { KiddySync } from '../services/KiddySync';
import { useLockingStore } from '../store/useLockingStore';
import { useChildStore } from '../store/useChildStore';
import { useLockBlockStore, type LockBlockReason } from '../store/useLockBlockStore';

function mapBlockReason(reason: string, currentStars: number, requiredStars: number): LockBlockReason {
  if (reason === 'insufficient_stars') return 'insufficient_stars';
  if (reason === 'ready_to_unlock') return 'ready_to_unlock';
  if (reason === 'time_expired') return 'time_expired';
  return currentStars >= requiredStars ? 'ready_to_unlock' : 'insufficient_stars';
}

function presentBlock(data: {
  packageName: string;
  appLabel: string;
  reason: string;
  currentStars: number;
  requiredStars: number;
}) {
  const bundle = useLockingStore.getState().syncBundle;
  const required = data.requiredStars || bundle?.defaultRule?.starsRequired || 20;
  const current =
    data.currentStars ??
    useLockingStore.getState().starBalance ??
    useChildStore.getState().child?.stars ??
    0;

  useLockBlockStore.getState().show({
    packageName: data.packageName,
    appLabel: data.appLabel,
    reason: mapBlockReason(data.reason, current, required),
    currentStars: current,
    requiredStars: required,
  });
}

/**
 * Listens for native block events and spend-and-open requests.
 * Does NOT auto-spend stars — the child must tap "Spend and open".
 */
export function ProtectionEngine() {
  const protectionActive = useLockingStore((s) => s.protectionActive);
  const starBalance = useLockingStore((s) => s.starBalance);
  const spendBusyRef = useRef(false);

  useEffect(() => {
    const blocked = AppLockBridge.onAppBlocked((data) => {
      presentBlock(data);
    });

    const spend = AppLockBridge.onSpendAndOpen((data) => {
      void handleSpendAndOpen(data.packageName, data.appLabel);
    });

    void AppLockBridge.consumePendingBlock().then((pending) => {
      if (pending) presentBlock(pending);
    });

    return () => {
      blocked.remove();
      spend.remove();
    };
  }, []);

  // Keep star count live while the block popup is open.
  useEffect(() => {
    if (useLockBlockStore.getState().visible) {
      useLockBlockStore.getState().updateStars(starBalance);
    }
  }, [starBalance]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void AppLockBridge.consumePendingBlock().then((pending) => {
        if (pending) presentBlock(pending);
      });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!protectionActive) return;
    void AppLockBridge.watchForegroundApp();
    return () => {
      void AppLockBridge.stopWatchingForegroundApp();
    };
  }, [protectionActive]);

  async function handleSpendAndOpen(packageName: string, appLabel: string) {
    if (spendBusyRef.current) return;
    const childId = useChildStore.getState().child?.id;
    if (!childId) return;

    spendBusyRef.current = true;
    try {
      await KiddySync.spendAndUnlockApp(childId, packageName, appLabel);
      useLockBlockStore.getState().dismiss();
      await AppLockBridge.dismissBlockOverlay();
    } catch (e) {
      console.warn('[ProtectionEngine] spendAndOpen failed', e);
      const bundle = useLockingStore.getState().syncBundle;
      presentBlock({
        packageName,
        appLabel,
        reason: 'insufficient_stars',
        currentStars: useLockingStore.getState().starBalance,
        requiredStars: bundle?.defaultRule?.starsRequired ?? 20,
      });
    } finally {
      spendBusyRef.current = false;
    }
  }

  return null;
}
