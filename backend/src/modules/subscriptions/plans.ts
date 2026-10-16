import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export interface PlanDefinition {
  plan: SubscriptionPlan;
  label: string;
  months: number;
  amountDa: number;
  currency: 'DZD';
  maxKids: number;
  lifetime: boolean;
  badge?: string;
  blurb: string;
}

export const PLAN_CATALOG: Partial<Record<SubscriptionPlan, PlanDefinition>> = {
  MONTH_1: {
    plan: SubscriptionPlan.MONTH_1,
    label: 'Monthly',
    months: 1,
    amountDa: 450,
    currency: 'DZD',
    maxKids: 2,
    lifetime: false,
    blurb: 'All features · up to 2 kids',
  },
  YEAR_1: {
    plan: SubscriptionPlan.YEAR_1,
    label: 'Yearly',
    months: 12,
    amountDa: 4900,
    currency: 'DZD',
    maxKids: 5,
    lifetime: false,
    badge: 'BEST VALUE',
    blurb: 'All features · up to 5 kids',
  },
  LIFETIME: {
    plan: SubscriptionPlan.LIFETIME,
    label: 'Founder lifetime',
    months: 1200,
    amountDa: 5900,
    currency: 'DZD',
    maxKids: 5,
    lifetime: true,
    badge: 'FOUNDER',
    blurb: 'Pay once · all features forever · up to 5 kids',
  },
};

export const PUBLIC_PLANS: PlanDefinition[] = [
  PLAN_CATALOG.MONTH_1!,
  PLAN_CATALOG.YEAR_1!,
  PLAN_CATALOG.LIFETIME!,
];

export const TRIAL_MAX_KIDS = 2;

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function planDefinition(plan?: SubscriptionPlan | null) {
  if (!plan) return null;
  return PLAN_CATALOG[plan] ?? null;
}

export function maxKidsForSubscription(sub: {
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
} | null) {
  if (!sub) return TRIAL_MAX_KIDS;
  const now = new Date();
  if (sub.status === SubscriptionStatus.TRIAL && sub.trialEndsAt > now) return TRIAL_MAX_KIDS;
  if (sub.status === SubscriptionStatus.ACTIVE) {
    if (sub.plan === SubscriptionPlan.LIFETIME) return PLAN_CATALOG.LIFETIME!.maxKids;
    if (sub.currentPeriodEnd && sub.currentPeriodEnd < now) return TRIAL_MAX_KIDS;
    return planDefinition(sub.plan)?.maxKids ?? TRIAL_MAX_KIDS;
  }
  return TRIAL_MAX_KIDS;
}
