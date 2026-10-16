import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppLockStore, usePermissionsStatus } from '../store/useAppLockStore';
import { AppLockBridge } from '../services/AppLockBridge';

let permissionsListenerCount = 0;

export function usePermissions() {
  const permissionsStatus = usePermissionsStatus();
  const refreshPermissions = useAppLockStore((s) => s.refreshPermissions);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    permissionsListenerCount += 1;
    if (permissionsListenerCount > 1) {
      return () => {
        permissionsListenerCount -= 1;
      };
    }

    const debouncedRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        refreshPermissions();
      }, 800);
    };

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') debouncedRefresh();
    });

    return () => {
      permissionsListenerCount -= 1;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      sub.remove();
    };
  }, [refreshPermissions]);

  const openSettings = async (permission: string) => {
    switch (permission) {
      case 'usageStatsAccess':
        await AppLockBridge.openUsageAccessSettings();
        break;
      case 'accessibilityService':
        await AppLockBridge.openAccessibilitySettings();
        break;
      case 'displayOverOtherApps':
        await AppLockBridge.openOverlaySettings();
        break;
      case 'batteryOptimizationIgnored':
        await AppLockBridge.openBatteryOptimizationSettings();
        break;
      case 'notificationPermission':
        await AppLockBridge.openNotificationSettings();
        break;
    }
  };

  const allGranted =
    permissionsStatus.usageStatsAccess === 'granted' &&
    permissionsStatus.accessibilityService === 'granted' &&
    permissionsStatus.displayOverOtherApps === 'granted';

  const missingCount = Object.values(permissionsStatus).filter(
    (v) => v !== 'granted'
  ).length;

  return {
    permissionsStatus,
    allGranted,
    missingCount,
    refresh: refreshPermissions,
    openSettings,
  };
}
