import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { SPACING } from '../../constants/theme';

import { markWelcomeDone } from '../../lib/onboarding';

export default function OnboardingWelcome() {
  const router = useRouter();

  const onContinue = async () => {
    await markWelcomeDone();
    router.push('/onboarding/create-child');
  };

  return (
    <KScreen scroll={false}>
      <OnboardingShell
        step={1}
        total={8}
        title="Welcome to WLIDI"
        subtitle="Control your child's tablet from your phone"
      >
        <KText style={{ fontSize: 72, textAlign: 'center', marginTop: SPACING.xl }}>🛡️</KText>
        <KText variant="body" style={{ marginTop: SPACING.lg, lineHeight: 24 }}>
          WLIDI lets you block apps on your child's device, set star rules, and turn protection on or off — all from
          your phone.
        </KText>
        <KText variant="body" muted style={{ marginTop: SPACING.md, lineHeight: 24 }}>
          Your child earns stars by playing educative games on their tablet. Stars unlock blocked apps for a limited
          time.
        </KText>
        <View style={{ flex: 1 }} />
        <KButton label="Continue" size="lg" onPress={() => void onContinue()} />
      </OnboardingShell>
    </KScreen>
  );
}
