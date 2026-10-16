// ─── Installed App ───────────────────────────────────────────────────────────

export interface InstalledApp {
  packageName: string;
  appName: string;
  /** Base-64 encoded PNG icon returned from native layer */
  icon: string | null;
  /** Bytes on disk */
  installSize?: number;
  /** ISO-8601 string */
  installedAt?: string;
}

// ─── Lock State ───────────────────────────────────────────────────────────────

export type LockStatus = 'locked' | 'unlocked' | 'timer-unlocked';

export interface LockedApp {
  packageName: string;
  appName: string;
  icon: string | null;
  status: LockStatus;
  /** Unix timestamp (ms) when the temporary unlock expires – null when permanently locked */
  unlockExpiresAt: number | null;
  /** Minutes granted during last unlock */
  grantedMinutes: number | null;
  /** Cumulative usage in seconds today */
  todayUsageSeconds: number;
  lockedAt: number; // Unix timestamp ms
}

// ─── Usage Stats ─────────────────────────────────────────────────────────────

export interface AppUsageStat {
  packageName: string;
  appName?: string;
  totalTimeInForeground: number; // seconds
  lastTimeUsed: number; // Unix timestamp ms
  lastTimeForeground?: number;
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export type PermissionState = 'granted' | 'denied' | 'unknown';

export interface PermissionsStatus {
  usageStatsAccess: PermissionState;
  accessibilityService: PermissionState;
  displayOverOtherApps: PermissionState;
  batteryOptimizationIgnored: PermissionState;
  notificationPermission: PermissionState;
}

// ─── Events from Native ──────────────────────────────────────────────────────

export interface ForegroundAppEvent {
  packageName: string;
  appName: string;
  timestamp: number;
}

export interface TimerExpiredEvent {
  packageName: string;
  appName: string;
}

export interface TimerTickEvent {
  packageName: string;
  remainingSeconds: number;
}

export interface PermissionChangedEvent {
  permission: keyof PermissionsStatus;
  state: PermissionState;
}

// ─── Native Module Interfaces ─────────────────────────────────────────────────

export interface IUsageTrackerModule {
  getInstalledApps(): Promise<InstalledApp[]>;
  getCurrentForegroundApp(): Promise<ForegroundAppEvent | null>;
  getUsageStats(startMs: number, endMs: number): Promise<AppUsageStat[]>;
  watchForegroundApp(): Promise<void>;
  stopWatchingForegroundApp(): Promise<void>;
}

export interface IAppLockModule {
  lockApp(packageName: string): Promise<void>;
  unlockApp(packageName: string, minutes: number): Promise<void>;
  lockAppImmediately(packageName: string): Promise<void>;
  getRemainingTime(packageName: string): Promise<number>; // seconds
  getLockedApps(): Promise<string[]>;
  isAppLocked(packageName: string): Promise<boolean>;
  checkPermissions(): Promise<PermissionsStatus>;
  openUsageAccessSettings(): Promise<void>;
  openAccessibilitySettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openBatteryOptimizationSettings(): Promise<void>;
  startForegroundService(): Promise<void>;
  stopForegroundService(): Promise<void>;
}

// ─── Store Shape ──────────────────────────────────────────────────────────────

export interface AppLockStore {
  // State
  installedApps: InstalledApp[];
  lockedApps: Record<string, LockedApp>;
  foregroundApp: ForegroundAppEvent | null;
  permissionsStatus: PermissionsStatus;
  isServiceRunning: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadInstalledApps: () => Promise<void>;
  lockApp: (app: InstalledApp) => Promise<void>;
  unlockApp: (packageName: string, minutes: number) => Promise<void>;
  relockApp: (packageName: string) => Promise<void>;
  removeFromLocked: (packageName: string) => void;
  setForegroundApp: (event: ForegroundAppEvent) => void;
  updateRemainingTime: (packageName: string, remainingSeconds: number) => void;
  handleTimerExpired: (packageName: string) => void;
  refreshPermissions: () => Promise<void>;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  setError: (error: string | null) => void;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface KiddyColors {
  primary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  error: string;
  success: string;
  warning: string;
  onPrimary: string;
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
}
