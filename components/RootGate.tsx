import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAppModeStore } from '../store/useAppModeStore';
import { AuthGate } from './AuthGate';
import { DeviceGate } from './DeviceGate';

/**
 * Top-level router: picks parent vs child-device mode, then delegates.
 */
export function RootGate() {
  const mode = useAppModeStore((s) => s.mode);
  const hydrated = useAppModeStore((s) => s.hydrated);
  const hydrate = useAppModeStore((s) => s.hydrate);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    const segmentList = segments as string[];
    const group = segmentList[0];
    const inSetup = group === 'setup';

    if (mode === 'unset' && !inSetup) {
      router.replace('/setup');
    }
  }, [hydrated, mode, segments, router]);

  if (!hydrated) return null;

  if (mode === 'parent') return <AuthGate />;
  if (mode === 'child-device') return <DeviceGate />;

  return null;
}
