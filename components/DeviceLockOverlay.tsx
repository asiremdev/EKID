import React, { useState } from 'react';
import { Modal, View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, WLIDI, RADIUS } from '../constants/theme';
import { IMAGES } from '../constants/assets';
import { useLockBlockStore } from '../store/useLockBlockStore';
import { useLockingStore } from '../store/useLockingStore';
import { KText } from './ui/KText';
import { KButton } from './ui/KButton';
import { SoftPlayBackground } from './ui/SoftPlayBackground';
import { WlidiSync } from '../services/WlidiSync';

export function DeviceLockOverlay() {
  const router = useRouter();
  const { visible, payload, dismiss } = useLockBlockStore();
  const defaultRule = useLockingStore((s) => s.defaultRule);
  const starBalance = useLockingStore((s) => s.starBalance);
  const [spending, setSpending] = useState(false);

  if (!payload) return null;

  const required = payload.requiredStars || defaultRule?.starsRequired || 20;
  const minutes = defaultRule?.minutesGranted ?? 10;
  const current = payload.currentStars ?? starBalance ?? 0;
  const canAfford = current >= required;

  const spendAndOpen = async () => {
    setSpending(true);
    try {
      await WlidiSync.spendAndUnlockApp(payload.packageName, payload.appLabel);
      dismiss();
    } finally {
      setSpending(false);
    }
  };

  const playGame = () => {
    dismiss();
    router.push('/(device)/game');
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.root}>
        <SoftPlayBackground />
        <View style={styles.content}>
          <KText variant="display" center style={styles.title}>
            Oops! This App is Locked.
          </KText>

          <Image source={IMAGES.lockIllustration} style={styles.lockImage} resizeMode="contain" />

          <KText variant="body" center muted style={styles.subtitle}>
            Play a game to earn stars, or spend stars to unlock.
          </KText>

          <KButton
            label="Play a Game"
            icon="🎮"
            iconRight="⭐"
            size="lg"
            onPress={playGame}
            style={styles.btn}
          />

          {canAfford ? (
            <KButton
              label={`Spend ${required} ⭐ to unlock (${minutes} min)`}
              variant="sky"
              size="lg"
              loading={spending}
              onPress={() => void spendAndOpen()}
              style={styles.btn}
            />
          ) : (
            <KButton
              label={`Need ${required - current} more ⭐ (${current}/${required})`}
              variant="sky"
              size="lg"
              disabled
              style={styles.btn}
            />
          )}

          <KButton label="Go home" variant="ghost" onPress={dismiss} style={{ marginTop: SPACING.md }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WLIDI.cream,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
    justifyContent: 'center',
  },
  title: {
    color: WLIDI.text,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  lockImage: {
    width: '100%',
    height: 200,
    marginBottom: SPACING.lg,
  },
  subtitle: {
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  btn: {
    marginTop: SPACING.sm,
  },
});
