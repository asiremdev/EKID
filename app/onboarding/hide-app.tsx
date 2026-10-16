import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { KCard } from '../../components/ui/KCard';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { SPACING } from '../../constants/theme';
import { markOnboardingStep } from '../../lib/onboarding';

const TIPS = [
  { emoji: '📁', title: 'Rename the app', body: 'Long-press the WLIDI icon → Rename to "Calculator" or "Notes".' },
  { emoji: '📂', title: 'Hide from home screen', body: 'On Samsung/Xiaomi: Settings → Hide apps. On stock Android: use a launcher folder.' },
  { emoji: '🔕', title: 'Disable notification previews', body: 'So the child does not see alerts from WLIDI.' },
  { emoji: '🔒', title: 'Keep permissions on', body: 'Accessibility, overlay & usage access must stay enabled on the child device.' },
];

export default function HideAppGuide() {
  const router = useRouter();

  const onContinue = async () => {
    await markOnboardingStep('finish');
    router.push('/onboarding/finish');
  };

  return (
    <KScreen>
      <OnboardingShell
        step={7}
        total={8}
        title="Hide WLIDI on the tablet"
        subtitle="Make the app discreet so only you know it's there."
      >
        {TIPS.map((t) => (
          <KCard key={t.title} style={{ marginBottom: SPACING.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <KText style={{ fontSize: 28, marginRight: SPACING.md }}>{t.emoji}</KText>
              <View style={{ flex: 1 }}>
                <KText variant="heading">{t.title}</KText>
                <KText variant="caption" muted style={{ marginTop: 4, lineHeight: 20 }}>
                  {t.body}
                </KText>
              </View>
            </View>
          </KCard>
        ))}

        <KButton label="Continue" size="lg" onPress={() => void onContinue()} style={{ marginTop: SPACING.lg }} />
      </OnboardingShell>
    </KScreen>
  );
}
