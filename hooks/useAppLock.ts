import { useState, useEffect, useCallback } from 'react';
import { useAppLockStore } from '../store/useAppLockStore';

function formatRemaining(seconds: number): string | null {
  if (seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function useAppLock(packageName: string) {
  const lockedApp = useAppLockStore((s) => s.lockedApps[packageName]);
  const unlockApp = useAppLockStore((s) => s.unlockApp);
  const relockApp = useAppLockStore((s) => s.relockApp);
  const removeFromLocked = useAppLockStore((s) => s.removeFromLocked);

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const isLocked = lockedApp?.status === 'locked';
  const isTimerUnlocked = lockedApp?.status === 'timer-unlocked';

  // Local countdown — never writes to global store per tick
  useEffect(() => {
    if (!isTimerUnlocked || !lockedApp?.unlockExpiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      const secs = Math.max(
        0,
        Math.floor((lockedApp.unlockExpiresAt! - Date.now()) / 1000)
      );
      setRemainingSeconds(secs);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isTimerUnlocked, lockedApp?.unlockExpiresAt]);

  const handleUnlock = useCallback(
    (minutes: number) => unlockApp(packageName, minutes),
    [unlockApp, packageName]
  );
  const handleRelock = useCallback(
    () => relockApp(packageName),
    [relockApp, packageName]
  );
  const handleRemove = useCallback(
    () => removeFromLocked(packageName),
    [removeFromLocked, packageName]
  );

  return {
    lockedApp,
    isLocked,
    isTimerUnlocked,
    remainingSeconds,
    remainingDisplay: isTimerUnlocked ? formatRemaining(remainingSeconds) : null,
    handleUnlock,
    handleRelock,
    handleRemove,
  };
}
