import React, { useCallback, useRef, useState } from 'react';
import { View, AppState } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { api } from '../../lib/api/client';
import { markOnboardingStep } from '../../lib/onboarding';

type PairStatus = {
  paired: boolean;
  childSetupComplete?: boolean;
  installedAppCount?: number;
};

export default function WaitChildSetup() {
  const colors = useThemeColors();
  const router = useRouter();
  const [status, setStatus] = useState<PairStatus>({ paired: false });
  const navigatedRef = useRef(false);

  const goSelectApps = useCallback(async () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    await markOnboardingStep('select-apps');
    router.replace('/onboarding/select-apps');
  }, [router]);

  const refresh = useCallback(async () => {
    const s = await api.get<PairStatus>('/parents/me/pairing/status');
    setStatus(s);
    const ready = s.childSetupComplete || (s.installedAppCount ?? 0) > 0;
    if (ready) {
      await goSelectApps();
    }
    return ready;
  }, [goSelectApps]);

  useFocusEffect(
    useCallback(() => {
      navigatedRef.current = false;
      void refresh();
      const poll = setInterval(() => void refresh(), 8000);
      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'active') void refresh();
      });
      return () => {
        clearInterval(poll);
        sub.remove();
      };
    }, [refresh]),
  );

  const appCount = status.installedAppCount ?? 0;

  return (
    <KScreen scroll={false}>
      <OnboardingShell
        step={4}
        total={8}
        title="Set up the child's phone"
        subtitle="On the child device: finish permissions, then WLIDI will send the app list here."
      >
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <KText style={{ fontSize: 64, textAlign: 'center' }}>📲</KText>
          <KText variant="body" center style={{ marginTop: SPACING.lg, lineHeight: 24 }}>
            Child device steps:{'\n'}
            1. Enter pairing code{'\n'}
            2. Allow all permissions{'\n'}
            3. Sync installed apps
          </KText>
          {appCount > 0 ? (
            <KText variant="caption" color={colors.success} center style={{ marginTop: SPACING.md }}>
              ✓ {appCount} apps received — continuing…
            </KText>
          ) : (
            <KText variant="caption" muted center style={{ marginTop: SPACING.md }}>
              Waiting for app list from child device…
            </KText>
          )}
        </View>
        <KButton label="Continue" onPress={() => void goSelectApps()} disabled={appCount === 0} />
        <KButton label="Refresh status" variant="ghost" onPress={() => void refresh()} style={{ marginTop: SPACING.sm }} />
      </OnboardingShell>
    </KScreen>
  );
}
