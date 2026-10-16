import { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { useChildStore } from '../store/useChildStore';
import { useLockingStore } from '../store/useLockingStore';
import { api } from '../lib/api/client';
import type { SetupStatus } from '../lib/api/protection-types';
import { isOnboardingCompleteLocal, resolveOnboardingRoute } from '../lib/onboarding';
import type { Child } from '../lib/api/types';

const PARENT_STANDALONE_SCREENS = new Set(['edit-apps', 'edit-rules']);

/**
 * WLIDI parent app routing — auth → onboarding → dashboard.
 * Child device runs WLIDI-kids separately.
 */
export function AuthGate() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const setChild = useChildStore((s) => s.setChild);
  const onboardingComplete = useLockingStore((s) => s.onboardingComplete);
  const segments = useSegments();
  const router = useRouter();
  const setupRef = useRef<SetupStatus | null>(null);
  const onboardingRouteRef = useRef<string>('/onboarding/welcome');
  const [setupReady, setSetupReady] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status !== 'authed') {
      setSetupReady(status !== 'loading');
      return;
    }

    let cancelled = false;
    setSetupReady(false);

    (async () => {
      try {
        const [setup, pairing] = await Promise.all([
          api.get<SetupStatus>('/parents/me/setup-status'),
          api.get<{ paired: boolean; hasChild: boolean }>('/parents/me/pairing/status'),
        ]);
        if (cancelled) return;

        setupRef.current = { ...setup, devicePaired: pairing.paired };

        const child = setup.childId
          ? await api.get<Child | null>('/parents/me/child')
          : null;
        if (child) setChild(child);

        if (setup.onboardingComplete) {
          useLockingStore.setState({ onboardingComplete: true });
        }

        const localDone = await isOnboardingCompleteLocal();
        if (localDone) useLockingStore.setState({ onboardingComplete: true });

        onboardingRouteRef.current = await resolveOnboardingRoute(setupRef.current);
      } catch (e) {
        console.warn('[AuthGate] setup fetch failed', e);
        onboardingRouteRef.current = await resolveOnboardingRoute(null);
      } finally {
        if (!cancelled) setSetupReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, setChild]);

  useEffect(() => {
    if (status === 'loading' || !setupReady) return;

    void (async () => {
      const segmentList = segments as string[];
      const group = segmentList[0];
      const inAuth = group === '(auth)';
      const inOnboarding = group === 'onboarding';
      const inParent = group === '(parent)';
      const inParentStack = group === '(parent)';
      const standaloneEdit =
        inParentStack && PARENT_STANDALONE_SCREENS.has(segmentList[1] ?? '');
      const editingOnboarding =
        inOnboarding && (segmentList[1] === 'select-apps' || segmentList[1] === 'reward-rules');

      if (status === 'guest') {
        if (!inAuth) router.replace('/(auth)/welcome');
        return;
      }

      const localComplete = await isOnboardingCompleteLocal();
      const isComplete =
        setupRef.current?.onboardingComplete || onboardingComplete || localComplete;

      if (!isComplete) {
        if (!inOnboarding && !inAuth) {
          router.replace(onboardingRouteRef.current as any);
        }
        return;
      }

      if (standaloneEdit || editingOnboarding) return;

      if (inOnboarding) {
        router.replace('/(parent)/(tabs)/dashboard');
        return;
      }

      if (!inParent && !inAuth) {
        router.replace('/(parent)/(tabs)/dashboard');
      }
    })();
  }, [status, setupReady, segments, onboardingComplete, router]);

  return null;
}
