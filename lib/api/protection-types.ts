export interface ProtectedAppRecord {
  packageName: string;
  appLabel: string | null;
  enabled: boolean;
}

export interface RewardRuleRecord {
  id: string;
  starsRequired: number;
  minutesGranted: number;
  isDefault: boolean;
}

export interface UnlockSessionRecord {
  id: string;
  packageName: string;
  appLabel: string | null;
  starsSpent: number;
  minutesGranted: number;
  startTime: string;
  endTime: string;
  status: string;
  remainingSeconds?: number;
}

export interface SyncBundle {
  child: {
    id: string;
    name: string;
    avatar: string | null;
    ageGroup: string;
    stars: number;
    xp: number;
    level: number;
    currentStreak: number;
    minutesEarned: number;
    minutesSpent: number;
  };
  protectionActive: boolean;
  onboardingComplete: boolean;
  protectedApps: ProtectedAppRecord[];
  rewardRules: RewardRuleRecord[];
  defaultRule: { starsRequired: number; minutesGranted: number } | null;
  activeSessions: UnlockSessionRecord[];
}

export type OnboardingStep =
  | 'welcome'
  | 'create-child'
  | 'pair-device'
  | 'wait-child-setup'
  | 'select-apps'
  | 'reward-rules'
  | 'hide-app'
  | 'finish'
  | 'complete';

export interface SetupStatus {
  hasChild: boolean;
  childId?: string | null;
  onboardingComplete: boolean;
  protectionActive: boolean;
  protectedAppCount: number;
  rewardRuleCount: number;
  installedAppCount?: number;
  devicePaired?: boolean;
  onboardingStep?: OnboardingStep;
}

export interface AutoUnlockResult {
  session: UnlockSessionRecord & { remainingSeconds: number };
  starsRemaining: number;
  starsSpent: boolean;
}
