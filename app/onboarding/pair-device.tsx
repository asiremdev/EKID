import React, { useCallback, useRef, useState } from 'react';
import { View, AppState } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { KCard } from '../../components/ui/KCard';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { api } from '../../lib/api/client';
import { markOnboardingStep } from '../../lib/onboarding';
import { useChildStore } from '../../store/useChildStore';

type PairStatus = {
  paired: boolean;
  childSetupComplete?: boolean;
  installedAppCount?: number;
};

export default function PairDevice() {
  const colors = useThemeColors();
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<PairStatus>({ paired: false });
  const [loading, setLoading] = useState(false);
  const navigatedRef = useRef(false);

  const childId = useChildStore((s) => s.child?.id);

  const goNext = useCallback(async () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    await markOnboardingStep('wait-child-setup');
    router.replace('/onboarding/wait-child-setup');
  }, [router]);

  const refresh = useCallback(async () => {
    const s = await api.get<PairStatus>('/parents/me/pairing/status', { childId });
    setStatus(s);
    if (s.paired) {
      await goNext();
    }
    return s.paired;
  }, [goNext, childId]);

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ code: string }>('/parents/me/pairing/code', { childId });
      setCode(res.code);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      navigatedRef.current = false;
      void (async () => {
        const paired = await refresh();
        if (!paired && !code) await generateCode();
      })();

      const poll = setInterval(() => {
        void refresh();
      }, 8000);

      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'active') void refresh();
      });

      return () => {
        clearInterval(poll);
        sub.remove();
      };
    }, [refresh, code]),
  );

  return (
    <KScreen>
      <OnboardingShell
        step={3}
        total={8}
        title="Pair child's device"
        subtitle="Install WLIDI on the child's tablet, choose Child's tablet, then enter this code."
      >
        <KCard color={colors.primaryContainer} style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
          <KText variant="caption" muted>
            Pairing code
          </KText>
          <KText variant="title" style={{ fontSize: 42, letterSpacing: 8, marginTop: SPACING.sm }}>
            {code ?? '······'}
          </KText>
          <KText variant="caption" muted style={{ marginTop: SPACING.sm }}>
            Expires in 15 minutes
          </KText>
        </KCard>

        <KText variant="body" style={{ marginTop: SPACING.lg, lineHeight: 24 }}>
          1. Install WLIDI on the child's phone or tablet{'\n'}
          2. Choose "Child's tablet" on first launch{'\n'}
          3. Enter this code → grant permissions → sync apps{'\n'}
          4. You'll continue here automatically when paired
        </KText>

        {status.paired ? (
          <KText variant="caption" color={colors.success} style={{ marginTop: SPACING.md }}>
            ✓ Device paired — opening next step…
          </KText>
        ) : (
          <KText variant="caption" muted style={{ marginTop: SPACING.md }}>
            Waiting for child's device…
          </KText>
        )}

        <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
          <KButton label="Refresh code" variant="ghost" loading={loading} onPress={() => void generateCode()} />
          {status.paired ? (
            <KButton label="Continue" onPress={() => void goNext()} />
          ) : (
            <KButton label="Check pairing" onPress={() => void refresh()} />
          )}
        </View>
      </OnboardingShell>
    </KScreen>
  );
}
