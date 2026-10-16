import Constants from 'expo-constants';

/**
 * Resolve the backend base URL.
 * Priority: EXPO_PUBLIC_API_URL env → app.json `extra.apiUrl` → localhost.
 *
 * When testing on a physical device, set this to your machine's LAN IP, e.g.
 * `http://192.168.1.20:4000/api/v1` (edit app.json `extra.apiUrl`).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.trim();
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExtra) return fromExtra.trim();
  return 'http://localhost:4100/api/v1';
}

export const API_URL = resolveApiUrl();
// Helps confirm which backend the app is talking to (visible in Metro logs).
console.log(`[API] base URL = ${API_URL}`);

export const STORAGE_KEYS = {
  accessToken: 'kiddy.auth.accessToken',
  refreshToken: 'kiddy.auth.refreshToken',
  authUser: 'kiddy.auth.user',
  selectedChildId: 'kiddy.child.selectedId',
  onboardingDone: 'kiddy.onboarding.done',
  welcomeDone: 'kiddy.onboarding.welcomeDone',
  permissionsDone: 'kiddy.onboarding.permissionsDone',
  onboardingStep: 'kiddy.onboarding.lastStep',
} as const;
