/**
 * AppLockBridge
 *
 * Single entry-point for all communication between React Native and
 * the native Android modules (UsageTrackerModule + AppLockModule).
 * Falls back to mock data when running on a non-Android platform or
 * in Expo Go so the JS layer can be developed without a real device.
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type {
  InstalledApp,
  AppUsageStat,
  ForegroundAppEvent,
  PermissionsStatus,
} from '../types';

const IS_ANDROID = Platform.OS === 'android';

const { UsageTrackerModule, AppLockModule } = NativeModules as {
  UsageTrackerModule?: {
    getInstalledApps(): Promise<InstalledApp[]>;
    getAppIcon(packageName: string): Promise<string | null>;
    getCurrentForegroundApp(): Promise<ForegroundAppEvent | null>;
    getUsageStats(startMs: number, endMs: number): Promise<AppUsageStat[]>;
    watchForegroundApp(): Promise<void>;
    stopWatchingForegroundApp(): Promise<void>;
  };
  AppLockModule?: {
    lockApp(packageName: string): Promise<void>;
    unlockApp(packageName: string, minutes: number): Promise<void>;
    lockAppImmediately(packageName: string): Promise<void>;
    removeAppFromLock(packageName: string): Promise<void>;
    getRemainingTime(packageName: string): Promise<number>;
    getLockedApps(): Promise<string[]>;
    isAppLocked(packageName: string): Promise<boolean>;
    checkPermissions(): Promise<PermissionsStatus>;
    openUsageAccessSettings(): Promise<void>;
    openAccessibilitySettings(): Promise<void>;
    openOverlaySettings(): Promise<void>;
    openBatteryOptimizationSettings(): Promise<void>;
    openNotificationSettings(): Promise<void>;
    startForegroundService(): Promise<void>;
    stopForegroundService(): Promise<void>;
    setProtectionActive(active: boolean): Promise<void>;
    syncLockConfig(config: {
      protectionActive: boolean;
      starBalance: number;
      starsRequired: number;
      minutesGranted: number;
      protectedPackages: string[];
    }): Promise<void>;
    launchApp(packageName: string): Promise<void>;
    dismissBlockOverlay(): Promise<void>;
    consumePendingBlock(): Promise<{
      packageName: string;
      appLabel: string;
      reason: string;
      currentStars: number;
      requiredStars: number;
    } | null>;
  };
};

// ─── Mock Data (dev / non-Android) ───────────────────────────────────────────

const MOCK_APPS: InstalledApp[] = [
  { packageName: 'com.google.android.youtube', appName: 'YouTube', icon: null },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', icon: null },
  { packageName: 'com.roblox.client', appName: 'Roblox', icon: null },
  { packageName: 'com.instagram.android', appName: 'Instagram', icon: null },
  { packageName: 'com.facebook.katana', appName: 'Facebook', icon: null },
  { packageName: 'com.snapchat.android', appName: 'Snapchat', icon: null },
  { packageName: 'com.twitter.android', appName: 'Twitter / X', icon: null },
  { packageName: 'com.discord', appName: 'Discord', icon: null },
];

const MOCK_PERMISSIONS: PermissionsStatus = {
  usageStatsAccess: 'denied',
  accessibilityService: 'denied',
  displayOverOtherApps: 'denied',
  batteryOptimizationIgnored: 'denied',
  notificationPermission: 'denied',
};

// ─── Event Emitter ────────────────────────────────────────────────────────────

let _emitter: NativeEventEmitter | null = null;

function getEmitter(): NativeEventEmitter | null {
  if (!IS_ANDROID || !UsageTrackerModule) return null;
  if (!_emitter) {
    _emitter = new NativeEventEmitter(UsageTrackerModule as any);
  }
  return _emitter;
}

function getAppLockEmitter(): NativeEventEmitter | null {
  if (!IS_ANDROID || !AppLockModule) return null;
  return new NativeEventEmitter(AppLockModule as any);
}

// ─── Bridge API ───────────────────────────────────────────────────────────────

type LockConfig = {
  protectionActive: boolean;
  starBalance: number;
  starsRequired: number;
  minutesGranted: number;
  protectedPackages: string[];
};

export const AppLockBridge = {
  // ── Apps ──────────────────────────────────────────────────────────────────
  getInstalledApps: async (): Promise<InstalledApp[]> => {
    if (!IS_ANDROID || !UsageTrackerModule) return MOCK_APPS;
    return UsageTrackerModule.getInstalledApps();
  },

  getAppIcon: async (packageName: string): Promise<string | null> => {
    if (!IS_ANDROID || !UsageTrackerModule) return null;
    return UsageTrackerModule.getAppIcon(packageName);
  },

  getCurrentForegroundApp: async (): Promise<ForegroundAppEvent | null> => {
    if (!IS_ANDROID || !UsageTrackerModule) return null;
    return UsageTrackerModule.getCurrentForegroundApp();
  },

  getUsageStats: async (
    startMs: number,
    endMs: number
  ): Promise<AppUsageStat[]> => {
    if (!IS_ANDROID || !UsageTrackerModule) return [];
    return UsageTrackerModule.getUsageStats(startMs, endMs);
  },

  watchForegroundApp: async (): Promise<void> => {
    if (!IS_ANDROID || !UsageTrackerModule) return;
    return UsageTrackerModule.watchForegroundApp();
  },

  stopWatchingForegroundApp: async (): Promise<void> => {
    if (!IS_ANDROID || !UsageTrackerModule) return;
    return UsageTrackerModule.stopWatchingForegroundApp();
  },

  // ── Locking ───────────────────────────────────────────────────────────────
  lockApp: async (packageName: string): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    if (!packageName?.trim()) throw new Error('Invalid package name');
    return AppLockModule.lockApp(packageName);
  },

  unlockApp: async (packageName: string, minutes: number): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    return AppLockModule.unlockApp(packageName, minutes);
  },

  removeAppFromLock: async (packageName: string): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    return AppLockModule.removeAppFromLock(packageName);
  },

  getRemainingTime: async (packageName: string): Promise<number> => {
    if (!IS_ANDROID || !AppLockModule) return 0;
    return AppLockModule.getRemainingTime(packageName);
  },

  getLockedApps: async (): Promise<string[]> => {
    if (!IS_ANDROID || !AppLockModule) return [];
    return AppLockModule.getLockedApps();
  },

  isAppLocked: async (packageName: string): Promise<boolean> => {
    if (!IS_ANDROID || !AppLockModule) return false;
    return AppLockModule.isAppLocked(packageName);
  },

  // ── Permissions ───────────────────────────────────────────────────────────
  checkPermissions: async (): Promise<PermissionsStatus> => {
    if (!IS_ANDROID || !AppLockModule) return MOCK_PERMISSIONS;
    return AppLockModule.checkPermissions();
  },

  openUsageAccessSettings: async (): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    return AppLockModule.openUsageAccessSettings();
  },

  openAccessibilitySettings: async (): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    return AppLockModule.openAccessibilitySettings();
  },

  openOverlaySettings: async (): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    return AppLockModule.openOverlaySettings();
  },

  openBatteryOptimizationSettings: async (): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    return AppLockModule.openBatteryOptimizationSettings();
  },

  openNotificationSettings: async (): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule?.openNotificationSettings) return;
    return AppLockModule.openNotificationSettings();
  },

  // ── Service ───────────────────────────────────────────────────────────────
  startForegroundService: async (): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    return AppLockModule.startForegroundService();
  },

  stopForegroundService: async (): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule) return;
    return AppLockModule.stopForegroundService();
  },

  setProtectionActive: async (active: boolean): Promise<void> => {
    console.log('[AppLockBridge] setProtectionActive', active);
    if (!IS_ANDROID || !AppLockModule?.setProtectionActive) return;
    return AppLockModule.setProtectionActive(active);
  },

  syncLockConfig: async (config: LockConfig) => {
    console.log('[AppLockBridge] syncLockConfig', {
      protectionActive: config.protectionActive,
      stars: config.starBalance,
      apps: config.protectedPackages.length,
    });
    if (!IS_ANDROID || !AppLockModule?.syncLockConfig) return;
    return AppLockModule.syncLockConfig(config);
  },

  launchApp: async (packageName: string): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule?.launchApp) return;
    return AppLockModule.launchApp(packageName);
  },

  dismissBlockOverlay: async (): Promise<void> => {
    if (!IS_ANDROID || !AppLockModule?.dismissBlockOverlay) return;
    return AppLockModule.dismissBlockOverlay();
  },

  consumePendingBlock: async () => {
    if (!IS_ANDROID || !AppLockModule?.consumePendingBlock) return null;
    return AppLockModule.consumePendingBlock();
  },

  // ── Event Subscriptions ───────────────────────────────────────────────────
  onForegroundAppChanged: (
    callback: (event: ForegroundAppEvent) => void
  ) => {
    const emitter = getEmitter();
    if (!emitter) return { remove: () => {} };
    const sub = emitter.addListener('onForegroundAppChanged', callback);
    return sub;
  },

  onTimerTick: (
    callback: (data: { packageName: string; remainingSeconds: number }) => void
  ) => {
    const emitter = getEmitter();
    if (!emitter) return { remove: () => {} };
    const sub = emitter.addListener('onTimerTick', callback);
    return sub;
  },

  onTimerExpired: (
    callback: (data: { packageName: string }) => void
  ) => {
    const emitter = getEmitter();
    if (!emitter) return { remove: () => {} };
    const sub = emitter.addListener('onTimerExpired', callback);
    return sub;
  },

  onPermissionChanged: (
    callback: (data: { permission: string; state: string }) => void
  ) => {
    const emitter = getEmitter();
    if (!emitter) return { remove: () => {} };
    const sub = emitter.addListener('onPermissionChanged', callback);
    return sub;
  },

  onAppBlocked: (
    callback: (data: {
      packageName: string;
      appLabel: string;
      reason: string;
      currentStars: number;
      requiredStars: number;
    }) => void,
  ) => {
    const emitter = getAppLockEmitter();
    if (!emitter) return { remove: () => {} };
    return emitter.addListener('onAppBlocked', callback);
  },

  onNativeAutoUnlock: (
    callback: (data: {
      packageName: string;
      starsRemaining: number;
      starsSpent: number;
      minutesGranted: number;
    }) => void,
  ) => {
    const emitter = getAppLockEmitter();
    if (!emitter) return { remove: () => {} };
    return emitter.addListener('onNativeAutoUnlock', callback);
  },

  onSpendAndOpen: (
    callback: (data: { packageName: string; appLabel: string }) => void,
  ) => {
    const emitter = getAppLockEmitter();
    if (!emitter) return { remove: () => {} };
    return emitter.addListener('onSpendAndOpen', callback);
  },
};
