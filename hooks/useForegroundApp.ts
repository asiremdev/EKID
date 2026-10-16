import { useEffect } from 'react';
import { useAppLockStore } from '../store/useAppLockStore';
import { AppLockBridge } from '../services/AppLockBridge';

export function useForegroundApp() {
  const setForegroundApp = useAppLockStore((s) => s.setForegroundApp);
  const handleTimerExpired = useAppLockStore((s) => s.handleTimerExpired);

  useEffect(() => {
    const foregroundSub = AppLockBridge.onForegroundAppChanged((event) => {
      setForegroundApp(event);
    });

    const expiredSub = AppLockBridge.onTimerExpired(({ packageName }) => {
      handleTimerExpired(packageName);
    });

    return () => {
      foregroundSub.remove();
      expiredSub.remove();
    };
  }, [setForegroundApp, handleTimerExpired]);
}
