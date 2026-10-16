import React, { useRef, useState } from 'react';
import { View, TextInput, Alert, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Device from 'expo-device';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { SPACING, COLORS_DARK, RADIUS } from '../../constants/theme';
import { GlowBackground } from '../../components/ui/GlowBackground';
import { deviceApi, DeviceApiError } from '../../lib/deviceApi';
import { deviceStorage } from '../../lib/deviceStorage';
import { WlidiSync } from '../../services/WlidiSync';
import { useAuthStore } from '../../store/useAuthStore';
import { useChildStore } from '../../store/useChildStore';
import { useAppModeStore } from '../../store/useAppModeStore';
import type { AgeGroup } from '../../lib/api/types';

export default function PairScreen() {
  const router = useRouter();
  const resetMode = useAppModeStore((s) => s.resetMode);
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleClaim = async () => {
    const code = digits.replace(/\D/g, '');
    if (code.length !== 6) {
      Alert.alert('Enter code', 'Enter the 6-digit code shown on the parent phone.');
      return;
    }

    setLoading(true);
    try {
      const deviceName = Device.deviceName ?? `${Platform.OS} device`;
      const result = await deviceApi.claimPairing(code, deviceName);
      await deviceStorage.setToken(result.deviceToken);
      await deviceStorage.setChild(result.child);
      await WlidiSync.applyInitialBundle(result.sync);

      useAuthStore.setState({ status: 'authed', user: null });
      useChildStore.getState().setChild({
        id: result.child.id,
        parentId: '',
        name: result.child.name,
        avatar: null,
        ageGroup: result.child.ageGroup as AgeGroup,
        stars: result.child.stars,
        xp: 0,
        level: 1,
        currentStreak: 0,
        bestStreak: 0,
        minutesEarned: 0,
        minutesSpent: 0,
        createdAt: '',
      });

      WlidiSync.startPeriodicSync();
      router.replace('/(device)/permissions');
    } catch (e) {
      const msg = e instanceof DeviceApiError ? e.message : 'Could not pair this device.';
      Alert.alert('Pairing failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const switchToParent = () => {
    Alert.alert('Switch mode?', 'This will take you back to parent setup.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: () => {
          void (async () => {
            WlidiSync.stopPeriodicSync();
            await deviceStorage.clear();
            await resetMode();
            router.replace('/setup');
          })();
        },
      },
    ]);
  };

  return (
    <KScreen scroll={false} style={{ backgroundColor: COLORS_DARK.background }}>
      <GlowBackground />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.lg }}>
        <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center' }}>
          <KText style={{ fontSize: 56 }}>🔗</KText>
          <KText variant="title" center color={COLORS_DARK.onBackground} style={{ marginTop: SPACING.md }}>
            Pair this device
          </KText>
          <KText variant="body" center muted style={{ marginTop: SPACING.sm, marginBottom: SPACING.xl, lineHeight: 22 }}>
            Open WLIDI on the parent phone, go to pairing, and enter the 6-digit code here.
          </KText>
        </Animated.View>

        <PressableCodeInput
          value={digits}
          onChange={setDigits}
          inputRef={inputRef}
          onSubmit={() => void handleClaim()}
        />

        <KButton
          label="Connect device"
          size="lg"
          loading={loading}
          onPress={() => void handleClaim()}
          style={{ marginTop: SPACING.xl }}
        />

        <KButton label="Wrong device? Switch to parent mode" variant="ghost" onPress={switchToParent} style={{ marginTop: SPACING.lg }} />
      </View>
    </KScreen>
  );
}

function PressableCodeInput({
  value,
  onChange,
  inputRef,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<TextInput>;
  onSubmit: () => void;
}) {
  const chars = value.replace(/\D/g, '').slice(0, 6).split('');
  while (chars.length < 6) chars.push('');

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm }}>
        {chars.map((ch, i) => (
          <View
            key={i}
            style={{
              width: 48,
              height: 56,
              borderRadius: RADIUS.md,
              borderWidth: 2,
              borderColor: ch ? COLORS_DARK.primary : COLORS_DARK.outline,
              backgroundColor: COLORS_DARK.surfaceVariant,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KText variant="title" color={COLORS_DARK.onSurface}>
              {ch || '·'}
            </KText>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
      />
      <KButton label="Tap to type" variant="ghost" onPress={() => inputRef.current?.focus()} style={{ marginTop: SPACING.md }} />
    </View>
  );
}
