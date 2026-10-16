import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { WlidiLogo } from '../../components/ui/WlidiLogo';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { useAppModeStore } from '../../store/useAppModeStore';

const MODES = [
  {
    id: 'parent' as const,
    emoji: '📱',
    title: 'Parent phone',
    subtitle: 'Control blocking, rules & pairing from your phone',
    color: WLIDI.mint,
    border: WLIDI.teal,
  },
  {
    id: 'child-device' as const,
    emoji: '📲',
    title: "Child's tablet",
    subtitle: 'Install on the device you want to protect & pair it',
    color: WLIDI.skyBlue,
    border: WLIDI.tealLight,
  },
];

export default function SetupModeScreen() {
  const router = useRouter();
  const setMode = useAppModeStore((s) => s.setMode);

  const pick = async (mode: 'parent' | 'child-device') => {
    await setMode(mode);
    if (mode === 'parent') {
      router.replace('/(auth)/welcome');
    } else {
      router.replace('/(device)/pair');
    }
  };

  return (
    <KScreen scroll={false}>
      <View style={styles.center}>
        <WlidiLogo size="lg" />
        <KText variant="body" muted center style={styles.subtitle}>
          One app for parents and children.{'\n'}How will you use this device?
        </KText>

        {MODES.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => void pick(m.id)}
            style={({ pressed }) => [
              styles.modeCard,
              { backgroundColor: m.color, borderColor: m.border, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.modeIcon}>
              <KText style={{ fontSize: 28 }}>{m.emoji}</KText>
            </View>
            <View style={{ flex: 1 }}>
              <KText variant="heading">{m.title}</KText>
              <KText variant="caption" muted style={{ marginTop: 4, lineHeight: 18 }}>
                {m.subtitle}
              </KText>
            </View>
            <KText color={WLIDI.teal}>→</KText>
          </Pressable>
        ))}
      </View>
    </KScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  subtitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.xxl,
    borderWidth: 2,
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: WLIDI.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
});
