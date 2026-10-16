import React, { useCallback, useEffect, useState } from 'react';
import { Modal, View, ActivityIndicator, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SPACING, RADIUS } from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';
import { KText } from './ui/KText';
import { KButton } from './ui/KButton';
import {
  getParentAuthCapability,
  parentAuthMethodLabel,
  verifyParentIdentity,
  type ParentAuthMethod,
} from '../lib/parentAuth';

interface ParentGateModalProps {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void | Promise<void>;
}

function AuthIcon({ method }: { method: ParentAuthMethod }) {
  const emoji =
    method === 'face' ? '👤' : method === 'fingerprint' ? '👆' : method === 'iris' ? '👁️' : '🔐';
  return <KText style={{ fontSize: 52 }}>{emoji}</KText>;
}

export function ParentGateModal({ visible, onClose, onVerified }: ParentGateModalProps) {
  const colors = useThemeColors();
  const [hint, setHint] = useState('Use the same unlock you use on your lock screen.');
  const [method, setMethod] = useState<ParentAuthMethod>('fingerprint');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      false,
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const loadCapability = useCallback(async () => {
    const cap = await getParentAuthCapability();
    setMethod(cap.method);
    setHint(cap.hint);
  }, []);

  const runVerify = useCallback(async () => {
    if (verifying || unlocking) return;
    setError(null);
    setVerifying(true);
    try {
      const result = await verifyParentIdentity();
      if (!result.ok) {
        setError(result.error ?? 'Verification failed.');
        return;
      }
      setUnlocking(true);
      await onVerified();
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
      setUnlocking(false);
    }
  }, [verifying, unlocking, onVerified, onClose]);

  useEffect(() => {
    if (!visible) {
      setError(null);
      setVerifying(false);
      setUnlocking(false);
      return;
    }
    void loadCapability();
  }, [visible, loadCapability]);

  const busy = verifying || unlocking;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.82)',
          justifyContent: 'center',
          padding: SPACING.lg,
        }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View entering={FadeInDown.duration(380).springify()}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: RADIUS.xl,
                borderWidth: 2,
                borderColor: colors.primary,
                padding: SPACING.xl,
                shadowColor: colors.primary,
                shadowOpacity: 0.35,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 8 },
                elevation: 12,
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Animated.View
                  entering={FadeIn.delay(120)}
                  style={[
                    ringStyle,
                    {
                      width: 112,
                      height: 112,
                      borderRadius: 56,
                      backgroundColor: colors.primaryContainer,
                      borderWidth: 3,
                      borderColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: SPACING.lg,
                    },
                  ]}
                >
                  {busy ? <ActivityIndicator size="large" color={colors.primary} /> : <AuthIcon method={method} />}
                </Animated.View>

                <KText variant="title" center>
                  Parent mode
                </KText>
                <KText variant="body" muted center style={{ marginTop: SPACING.sm, lineHeight: 22 }}>
                  Only a parent can turn off protection. Verify with {parentAuthMethodLabel(method)} or your
                  phone lock.
                </KText>
              </View>

              <View
                style={{
                  marginTop: SPACING.lg,
                  padding: SPACING.md,
                  borderRadius: RADIUS.lg,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.outline,
                }}
              >
                <KText variant="caption" muted center style={{ lineHeight: 20 }}>
                  🛡️ {hint}
                </KText>
              </View>

              {error ? (
                <KText variant="caption" color={colors.error} center style={{ marginTop: SPACING.md }}>
                  {error}
                </KText>
              ) : null}

              <KButton
                label={unlocking ? 'Opening parent mode…' : `Verify with ${parentAuthMethodLabel(method)}`}
                size="lg"
                loading={busy}
                onPress={() => void runVerify()}
                style={{ marginTop: SPACING.xl }}
              />

              <KButton label="Cancel" variant="ghost" onPress={onClose} disabled={busy} style={{ marginTop: SPACING.sm }} />

              <KText variant="caption" muted center style={{ marginTop: SPACING.md }}>
                Kids cannot exit protection without this verification.
              </KText>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
