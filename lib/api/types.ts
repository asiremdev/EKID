// Mirrors the Kiddy backend (Phase 2A) response shapes.

export type AgeGroup = 'AGE_3_5' | 'AGE_5_7' | 'AGE_7_10';

export type ActivityType =
  | 'multiple_choice'
  | 'tap_object'
  | 'match_pairs'
  | 'letter_tracing'
  | 'number_tracing'
  | 'puzzle'
  | 'memory'
  | 'sequence'
  | 'missing_letter'
  | 'missing_number'
  | 'categorization'
  | 'odd_one_out'
  | 'maze'
  | 'shadow_match'
  | 'counting'
  | 'reading'
  | 'word_search'
  | 'crossword'
  | 'geography'
  | 'science'
  | 'history'
  | 'logic'
  | 'fractions'
  | 'math';

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type SubscriptionPlan = 'MONTH_1' | 'MONTH_3' | 'MONTH_12' | 'YEAR_1' | 'LIFETIME';
export type ChallengeType = 'DAILY' | 'WEEKLY';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'PARENT' | 'ADMIN';
  emailVerified: boolean;
  avatarUrl?: string | null;
  locale: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  avatar: string | null;
  ageGroup: AgeGroup;
  stars: number;
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  minutesEarned: number;
  minutesSpent: number;
  createdAt: string;
}

export interface ChildStats {
  stars: number;
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  minutesEarned: number;
  minutesSpent: number;
  activitiesCompleted: number;
  achievementsUnlocked: number;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  isActive: boolean;
  maxKids?: number;
  kidsUsed?: number;
}

export interface Plan {
  plan: SubscriptionPlan;
  label: string;
  months: number;
  amountCents: number;
  amountDa?: number;
  currency: string;
  maxKids?: number;
  lifetime?: boolean;
  badge?: string | null;
  blurb?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  slug: string;
  title: string;
  description?: string | null;
  ageGroup: AgeGroup;
  difficulty: number;
  subject?: string | null;
  starsReward: number;
  xpReward: number;
  metadata: Record<string, any>;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNext: number;
  progress: number;
  isMax: boolean;
}

export interface AttemptResult {
  attemptId: string;
  score: number;
  starsEarned: number;
  xpEarned: number;
  level: number;
  progress: LevelProgress;
  streak: { currentStreak: number; bestStreak: number; nextMilestone: number | null };
  unlockedAchievements: { code: string; title: string; starsReward: number }[];
}

export interface StarTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

export interface Unlock {
  id: string;
  appPackage: string;
  appLabel: string | null;
  minutes: number;
  starsCost: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startedAt: string;
  expiresAt: string;
}

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  metric: string;
  target: number;
  starsReward: number;
  xpReward: number;
  progress?: number;
  completed?: boolean;
  rewardClaimed?: boolean;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon?: string | null;
  metric: string;
  threshold: number;
  starsReward: number;
  xpReward: number;
  progress?: number;
  unlocked?: boolean;
  unlockedAt?: string | null;
}
