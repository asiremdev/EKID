/** Default reward tiers created during onboarding (Step 5). */
export const DEFAULT_REWARD_RULES = [
  { starsRequired: 20, minutesGranted: 10, sortOrder: 0, isDefault: true },
  { starsRequired: 40, minutesGranted: 20, sortOrder: 1, isDefault: false },
  { starsRequired: 100, minutesGranted: 60, sortOrder: 2, isDefault: false },
] as const;
