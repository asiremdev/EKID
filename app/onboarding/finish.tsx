import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { SPACING } from '../../constants/theme';
import { useChildStore } from '../../store/useChildStore';
import { useCompleteOnboarding } from '../../hooks/api/useProtectionApi';
import { KiddySync } from '../../services/KiddySync';
import { useLockingStore } from '../../store/useLockingStore';
import { markOnboardingComplete } from '../../lib/onboarding';
import { ApiError } from '../../lib/api/client';

export default function OnboardingFinish() {
  const router = useRouter();
  const child = useChildStore((s) => s.child);
  const complete = useCompleteOnboarding(child?.id ?? '');
  const [finishing, setFinishing] = React.useState(false);

  const onFinish = async () => {
    if (!child?.id) {
      Alert.alert('Missing child', 'Please go back and create your child profile.');
      return;
    }

    setFinishing(true);
    try {
      await complete.mutateAsync();

      useLockingStore.setState({ onboardingComplete: true, protectionActive: true });
      await markOnboardingComplete();

      try {
        await KiddySync.pull(child.id);
      } catch (syncErr) {
        console.warn('[OnboardingFinish] sync failed, continuing to dashboard', syncErr);
      }

      router.replace('/(parent)/(tabs)/dashboard');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not finish setup';
      Alert.alert('Setup error', msg);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <KScreen scroll={false}>
      <OnboardingShell step={8} total={8} title="You're All Set!" subtitle="WLIDI is ready to protect your child's device.">
        <KText style={{ fontSize: 72, textAlign: 'center', marginTop: SPACING.xl }}>🎉</KText>
        <KText variant="body" style={{ marginTop: SPACING.lg, lineHeight: 24 }}>
          Your child's tablet will sync blocking rules every 15 minutes. When they open a blocked app, they'll play an
          educative game or spend stars to unlock it.
        </KText>
        <KText variant="body" muted style={{ marginTop: SPACING.md, lineHeight: 24 }}>
          Blocking turns on automatically. Use the dashboard to turn it off anytime. You stay in control from your
          phone — no need to hand it to your child.
        </KText>
        <KButton
          label="Go to Dashboard"
          size="lg"
          loading={finishing || complete.isPending}
          onPress={() => void onFinish()}
          style={{ marginTop: SPACING.xl }}
        />
      </OnboardingShell>
    </KScreen>
  );
}
