import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { KCard } from '../../components/ui/KCard';
import { WlidiLogo } from '../../components/ui/WlidiLogo';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { useAppModeStore } from '../../store/useAppModeStore';

const FEATURES = [
  { emoji: '📱', title: 'Control from your phone', text: 'Block apps on the child tablet remotely' },
  { emoji: '🎮', title: 'Learn to unlock', text: 'One educative game per age group' },
  { emoji: '⭐', title: 'Stars = screen time', text: 'Simple points — no clutter' },
];

export default function Welcome() {
  const router = useRouter();
  const setMode = useAppModeStore((s) => s.setMode);

  const setupChildDevice = async () => {
    await setMode('child-device');
    router.replace('/(device)/pair');
  };

  return (
    <KScreen contentStyle={styles.content}>
      <View style={styles.hero}>
        <WlidiLogo size="lg" />
        <KText variant="body" muted center style={styles.tagline}>
          Parent control for your child's device
        </KText>
      </View>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <KCard key={f.title} color={WLIDI.white} style={styles.featureCard}>
            <View style={styles.featureRow}>
              <KText style={styles.featureEmoji}>{f.emoji}</KText>
              <View style={{ flex: 1 }}>
                <KText variant="heading">{f.title}</KText>
                <KText variant="caption" muted>
                  {f.text}
                </KText>
              </View>
            </View>
          </KCard>
        ))}
      </View>

      <View>
        <KButton label="Get Started" size="lg" onPress={() => router.push('/(auth)/register')} />
        <KButton
          label="I already have an account"
          variant="sky"
          onPress={() => router.push('/(auth)/login')}
          style={{ marginTop: SPACING.sm }}
        />
        <KButton
          label="Setting up the child's tablet instead?"
          variant="ghost"
          onPress={() => void setupChildDevice()}
          style={{ marginTop: SPACING.sm }}
        />
      </View>
    </KScreen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginTop: SPACING.xl },
  tagline: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg },
  features: { marginVertical: SPACING.lg },
  featureCard: { marginBottom: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureEmoji: { fontSize: 36, marginRight: SPACING.md },
});
