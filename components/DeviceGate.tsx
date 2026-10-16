import React, { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAppModeStore } from '../store/useAppModeStore';
import { deviceStorage } from '../lib/deviceStorage';
import { WlidiSync } from '../services/WlidiSync';
import { restoreNativeProtection } from '../services/restoreNativeProtection';
import { useAuthStore } from '../store/useAuthStore';
import { useChildStore } from '../store/useChildStore';
import type { AgeGroup } from '../lib/api/types';

/**
 * Routes child-device mode: pair → home → game.
 * Parent mode is handled by AuthGate.
 */
export function DeviceGate() {
  const mode = useAppModeStore((s) => s.mode);
  const hydrated = useAppModeStore((s) => s.hydrated);
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated || mode !== 'child-device') return;

    let cancelled = false;

    (async () => {
      const token = await deviceStorage.getToken();

      if (token) {
        useAuthStore.setState({ status: 'authed', user: null });

        const cached = await deviceStorage.getChild();
        if (cached) {
          useChildStore.getState().setChild({
            id: cached.id,
            parentId: '',
            name: cached.name,
            avatar: null,
            ageGroup: cached.ageGroup as AgeGroup,
            stars: cached.stars,
            xp: 0,
            level: 1,
            currentStreak: 0,
            bestStreak: 0,
            minutesEarned: 0,
            minutesSpent: 0,
            createdAt: '',
          });
        }

        // Restore native locks from local cache immediately (before network sync).
        await restoreNativeProtection().catch((e) =>
          console.warn('[DeviceGate] native restore failed', e),
        );

        WlidiSync.startPeriodicSync();
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, mode]);

  useEffect(() => {
    if (!hydrated || mode !== 'child-device' || !ready) return;

    void (async () => {
      const segmentList = segments as string[];
      const group = segmentList[0];
      const inDevice = group === '(device)';
      const inSetup = group === 'setup';

      if (inSetup) return;

      const token = await deviceStorage.getToken();

      if (!token) {
        if (!inDevice || segmentList[1] !== 'pair') {
          router.replace('/(device)/pair');
        }
        return;
      }

      const screen = segmentList[1];
      if (screen === 'pair' || screen === 'permissions') return;

      if (!inDevice) {
        router.replace('/(device)/home');
      }
    })();
  }, [hydrated, mode, ready, segments, router]);

  return null;
}
