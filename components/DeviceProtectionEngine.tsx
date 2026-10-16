import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { AppLockBridge } from '../services/AppLockBridge';
import { WlidiSync } from '../services/WlidiSync';
import { useLockingStore } from '../store/useLockingStore';
import { useLockBlockStore } from '../store/useLockBlockStore';

function presentBlock(data: {
  packageName: string;
  appLabel: string;
  reason: string;
  currentStars: number;
  requiredStars: number;
}) {
  const bundle = useLockingStore.getState().syncBundle;
  const required = data.requiredStars || bundle?.defaultRule?.starsRequired || 20;
  const current = data.currentStars ?? useLockingStore.getState().starBalance ?? 0;
  const reason =
    data.reason === 'insufficient_stars'
      ? 'insufficient_stars'
      : current >= required
        ? 'ready_to_unlock'
        : 'insufficient_stars';

  useLockBlockStore.getState().show({
    packageName: data.packageName,
    appLabel: data.appLabel,
    reason: reason as 'insufficient_stars' | 'ready_to_unlock',
    currentStars: current,
    requiredStars: required,
  });
}

/** Child-device protection — uses device token APIs via WlidiSync. */
export function DeviceProtectionEngine() {
  const starBalance = useLockingStore((s) => s.starBalance);
  const spendBusyRef = useRef(false);

  useEffect(() => {
    const blocked = AppLockBridge.onAppBlocked((data) => presentBlock(data));
    const spend = AppLockBridge.onSpendAndOpen((data) => {
      void handleSpend(data.packageName, data.appLabel);
    });

    void AppLockBridge.consumePendingBlock().then((p) => {
      if (p) presentBlock(p);
    });

    return () => {
      blocked.remove();
      spend.remove();
    };
  }, []);

  useEffect(() => {
    if (useLockBlockStore.getState().visible) {
      useLockBlockStore.getState().updateStars(starBalance);
    }
  }, [starBalance]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        void WlidiSync.pullOnForeground();
        void AppLockBridge.consumePendingBlock().then((p) => {
          if (p) presentBlock(p);
        });
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    void AppLockBridge.watchForegroundApp();
    return () => {
      void AppLockBridge.stopWatchingForegroundApp();
    };
  }, []);

  async function handleSpend(packageName: string, appLabel: string) {
    if (spendBusyRef.current) return;
    spendBusyRef.current = true;
    try {
      await WlidiSync.spendAndUnlockApp(packageName, appLabel);
      useLockBlockStore.getState().dismiss();
      await AppLockBridge.dismissBlockOverlay();
    } catch {
      presentBlock({
        packageName,
        appLabel,
        reason: 'insufficient_stars',
        currentStars: useLockingStore.getState().starBalance,
        requiredStars: useLockingStore.getState().syncBundle?.defaultRule?.starsRequired ?? 20,
      });
    } finally {
      spendBusyRef.current = false;
    }
  }

  return null;
}
