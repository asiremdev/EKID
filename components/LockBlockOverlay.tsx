import React, { useState } from 'react';
import { Modal, View, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING } from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';
import { useLockBlockStore } from '../store/useLockBlockStore';
import { useSelectedChild } from './useSelectedChild';
import { useActivities } from '../hooks/api/useActivitiesApi';
import { useLockingStore } from '../store/useLockingStore';
import { useChildStore } from '../store/useChildStore';
import { subjectMeta } from '../constants/design';
import { KText } from './ui/KText';
import { KButton } from './ui/KButton';
import { KCard } from './ui/KCard';
import { KiddySync } from '../services/KiddySync';
import { AppLockBridge } from '../services/AppLockBridge';

/** Full-screen block UI when a protected app needs stars or time ran out. */
export function LockBlockOverlay() {
  const colors = useThemeColors();
  const router = useRouter();
  const { visible, payload, dismiss } = useLockBlockStore();
  const child = useSelectedChild();
  const defaultRule = useLockingStore((s) => s.defaultRule);
  const starBalance = useLockingStore((s) => s.starBalance);
  const protectionActive = useLockingStore((s) => s.protectionActive);
  const [spending, setSpending] = useState(false);

  const { data, isLoading } = useActivities({
    ageGroup: child?.ageGroup,
    limit: 5,
  });

  if (!payload) return null;

  const required = payload.requiredStars || defaultRule?.starsRequired || 20;
  const minutes = defaultRule?.minutesGranted ?? 10;
  const current = payload.currentStars ?? starBalance ?? child?.stars ?? 0;
  const canAfford = current >= required;
  const timeExpired = payload.reason === 'time_expired';

  const handleSpendAndOpen = async () => {
    const childId = useChildStore.getState().child?.id ?? child?.id;
    if (!childId) {
      Alert.alert('Error', 'Child profile not loaded. Open Kiddy again.');
      return;
    }
    if (!canAfford) return;

    setSpending(true);
    try {
      await KiddySync.spendAndUnlockApp(childId, payload.packageName, payload.appLabel);
      dismiss();
      await AppLockBridge.dismissBlockOverlay();
    } catch (e: any) {
      const msg = e?.message ?? 'Could not unlock the app';
      if (msg.includes('insufficient') || msg.includes('INSUFFICIENT')) {
        useLockBlockStore.getState().show({
          ...payload,
          reason: 'insufficient_stars',
          currentStars: useLockingStore.getState().starBalance,
        });
      } else {
        Alert.alert('Unlock failed', msg);
      }
    } finally {
      setSpending(false);
    }
  };

  const openActivity = (activityId: string) => {
    dismiss();
    router.push(`/activity/${activityId}`);
  };

  const openLearningCenter = () => {
    dismiss();
    router.replace('/(child)/activities');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (!protectionActive) dismiss();
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.background, padding: SPACING.lg, paddingTop: SPACING.xxl }}>
        <KText style={{ fontSize: 64, textAlign: 'center' }}>{canAfford ? '🔓' : '⭐'}</KText>
        <KText variant="title" center style={{ marginTop: SPACING.md }}>
          {canAfford
            ? timeExpired
              ? 'Time is up!'
              : 'App is locked'
            : 'You need more stars!'}
        </KText>
        <KText variant="body" muted center style={{ marginTop: SPACING.xs }}>
          {canAfford
            ? `"${payload.appLabel}" can be unlocked for ${minutes} minutes.`
            : `"${payload.appLabel}" needs ${required} stars to unlock.`}
        </KText>

        <KCard style={{ marginTop: SPACING.xl }} color={colors.primaryContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <KText variant="caption" muted>
                Your stars
              </KText>
              <KText variant="title" color={colors.warning}>
                ⭐ {current}
              </KText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <KText variant="caption" muted>
                Cost
              </KText>
              <KText variant="heading" color={canAfford ? colors.success : colors.error}>
                {required} ⭐
              </KText>
              <KText variant="caption" muted>
                = {minutes} min
              </KText>
            </View>
          </View>
        </KCard>

        {canAfford ? (
          <KButton
            label={`Spend ${required} ⭐ and open`}
            size="lg"
            loading={spending}
            onPress={() => void handleSpendAndOpen()}
            style={{ marginTop: SPACING.xl }}
          />
        ) : (
          <>
            <KText variant="heading" style={{ marginTop: SPACING.xl, marginBottom: SPACING.sm }}>
              Earn stars with activities
            </KText>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                (data?.items ?? []).map((a) => {
                  const sm = subjectMeta(a.subject);
                  return (
                    <KCard key={a.id} onPress={() => openActivity(a.id)} style={{ marginBottom: SPACING.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <KText style={{ fontSize: 26, marginRight: SPACING.md }}>{sm.emoji}</KText>
                        <View style={{ flex: 1 }}>
                          <KText variant="heading">{a.title}</KText>
                          <KText variant="caption" color={colors.warning}>
                            +{a.starsReward} ⭐
                          </KText>
                        </View>
                        <KText>▶️</KText>
                      </View>
                    </KCard>
                  );
                })
              )}
            </ScrollView>

            <KButton
              label="⚡ Quick start activity"
              size="lg"
              onPress={() => {
                const first = data?.items?.[0];
                if (first) openActivity(first.id);
                else openLearningCenter();
              }}
              style={{ marginTop: SPACING.md }}
            />
          </>
        )}

        {!canAfford ? (
          <KButton label="Open learning center" variant="ghost" onPress={openLearningCenter} style={{ marginTop: SPACING.sm }} />
        ) : null}

        {!protectionActive ? (
          <KButton label="Close" variant="ghost" onPress={dismiss} style={{ marginTop: SPACING.sm }} />
        ) : null}
      </View>
    </Modal>
  );
}
