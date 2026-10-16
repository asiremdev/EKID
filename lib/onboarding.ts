import type { OnboardingStep, SetupStatus } from './api/protection-types';
import { STORAGE_KEYS } from './config';
import { prefStorage } from './storage';

const ROUTES: Record<OnboardingStep, string> = {
  welcome: '/onboarding/welcome',
  'create-child': '/onboarding/create-child',
  'pair-device': '/onboarding/pair-device',
  'wait-child-setup': '/onboarding/wait-child-setup',
  'select-apps': '/onboarding/select-apps',
  'reward-rules': '/onboarding/reward-rules',
  'hide-app': '/onboarding/hide-app',
  finish: '/onboarding/finish',
  complete: '/(parent)/(tabs)/dashboard',
};

export async function resolveOnboardingRoute(setup: SetupStatus | null): Promise<string> {
  if (setup?.onboardingComplete) return ROUTES.complete;

  const onboardingDone = (await prefStorage.get(STORAGE_KEYS.onboardingDone)) === '1';
  if (onboardingDone) return ROUTES.complete;

  const welcomeDone = (await prefStorage.get(STORAGE_KEYS.welcomeDone)) === '1';
  if (!welcomeDone) return ROUTES.welcome;
  if (!setup?.hasChild) return ROUTES['create-child'];
  if (!setup.devicePaired) return ROUTES['pair-device'];

  const step = setup.onboardingStep ?? inferStep(setup);
  if (step === 'complete') return ROUTES.complete;
  return ROUTES[step];
}

function inferStep(setup: SetupStatus): OnboardingStep {
  if (setup.onboardingComplete) return 'complete';
  if ((setup.installedAppCount ?? 0) === 0 && setup.devicePaired) return 'wait-child-setup';
  if (setup.protectedAppCount === 0) return 'select-apps';
  if (setup.rewardRuleCount === 0) return 'reward-rules';
  return 'hide-app';
}

export async function markWelcomeDone() {
  await prefStorage.set(STORAGE_KEYS.welcomeDone, '1');
}

export async function markOnboardingStep(step: OnboardingStep) {
  await prefStorage.set(STORAGE_KEYS.onboardingStep, step);
}

export async function markOnboardingComplete() {
  await prefStorage.set(STORAGE_KEYS.onboardingDone, '1');
  await prefStorage.set(STORAGE_KEYS.onboardingStep, 'complete');
}

export async function isOnboardingCompleteLocal(): Promise<boolean> {
  return (await prefStorage.get(STORAGE_KEYS.onboardingDone)) === '1';
}
