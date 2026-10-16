import type { PermissionsStatus } from '../types';
import { selectAllPermissionsGranted, useAppLockStore } from '../store/useAppLockStore';

export type PermissionKey = keyof PermissionsStatus;

export const REQUIRED_PERMISSIONS: {
  key: PermissionKey;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    key: 'accessibilityService',
    icon: '♿',
    title: 'Accessibility Service',
    description: 'Detects when a protected app opens so Kiddy can block or unlock it.',
  },
  {
    key: 'usageStatsAccess',
    icon: '📊',
    title: 'Usage Access',
    description: 'Tracks app usage and helps detect the foreground app.',
  },
  {
    key: 'displayOverOtherApps',
    icon: '🪟',
    title: 'Overlay Permission',
    description: 'Shows the lock screen when time is up or stars are needed.',
  },
  {
    key: 'batteryOptimizationIgnored',
    icon: '🔋',
    title: 'Ignore Battery Optimization',
    description: 'Keeps the monitoring service running in the background.',
  },
  {
    key: 'notificationPermission',
    icon: '🔔',
    title: 'Notification Permission',
    description: 'Required for the foreground service on Android 13+.',
  },
];

export function getMissingPermissions(status: PermissionsStatus): typeof REQUIRED_PERMISSIONS {
  return REQUIRED_PERMISSIONS.filter((p) => status[p.key] !== 'granted');
}

export function areAllPermissionsGranted(status: PermissionsStatus): boolean {
  return REQUIRED_PERMISSIONS.every((p) => status[p.key] === 'granted');
}

export async function refreshAndCheckPermissions(): Promise<{
  granted: boolean;
  missing: typeof REQUIRED_PERMISSIONS;
}> {
  await useAppLockStore.getState().refreshPermissions();
  const status = useAppLockStore.getState().permissionsStatus;
  const missing = getMissingPermissions(status);
  const granted = areAllPermissionsGranted(status);
  if (granted) {
    await useAppLockStore.getState().startMonitoring();
  }
  return { granted, missing };
}

export { selectAllPermissionsGranted };
