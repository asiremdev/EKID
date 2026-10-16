import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { KInput } from '../../components/ui/KInput';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { SPACING } from '../../constants/theme';
import { useChildStore } from '../../store/useChildStore';
import { useMyChild } from '../../hooks/api/useProtectionApi';
import { useSetRewardRules } from '../../hooks/api/useProtectionApi';
import { KiddySync } from '../../services/KiddySync';
import { ApiError } from '../../lib/api/client';
import { markOnboardingStep } from '../../lib/onboarding';
import { useLockingStore } from '../../store/useLockingStore';
import type { RewardRuleRecord } from '../../lib/api/protection-types';

const DEFAULT_RULES = [
  { starsRequired: 20, minutesGranted: 10, isDefault: true },
  { starsRequired: 40, minutesGranted: 20, isDefault: false },
  { starsRequired: 100, minutesGranted: 60, isDefault: false },
];

export default function RewardRules() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';
  const child = useChildStore((s) => s.child);
  const { data: myChild } = useMyChild();
  const childId = child?.id ?? myChild?.id ?? '';
  const setRules = useSetRewardRules(childId);
  const syncRules = useLockingStore((s) => s.syncBundle?.rewardRules ?? []);
  const [rules, setRulesState] = useState(DEFAULT_RULES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (syncRules.length > 0) {
      setRulesState(
        syncRules.map((r) => ({
          starsRequired: r.starsRequired,
          minutesGranted: r.minutesGranted,
          isDefault: r.isDefault,
        })),
      );
    }
  }, [syncRules.length]);

  const updateRule = (index: number, field: 'starsRequired' | 'minutesGranted', value: string) => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    setRulesState((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: n } : r)));
  };

  const onContinue = async () => {
    if (!childId) {
      Alert.alert('No child profile', 'Please create your child profile first.');
      router.replace('/onboarding/create-child');
      return;
    }

    setSaving(true);
    try {
      const saved = await setRules.mutateAsync(rules.map((r, i) => ({ ...r, sortOrder: i })));

      try {
        await KiddySync.pull(childId);
      } catch (syncErr) {
        console.warn('[RewardRules] sync pull failed after save, applying locally', syncErr);
        await KiddySync.applyRulesLocally(childId, saved as RewardRuleRecord[]);
      }

      if (isEditMode) {
        router.replace('/(parent)/(tabs)/dashboard');
        return;
      }

      await markOnboardingStep('hide-app');
      router.push('/onboarding/hide-app');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not save reward rules';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KScreen>
      <OnboardingShell
        step={isEditMode ? undefined : 6}
        total={isEditMode ? undefined : 8}
        title={isEditMode ? 'Edit reward rules' : 'Configure Reward Rules'}
        subtitle="Stars spent when your child opens a protected app."
      >
        {rules.map((rule, i) => (
          <View key={i} style={{ marginBottom: SPACING.lg }}>
            <KText variant="heading" style={{ marginBottom: SPACING.sm }}>
              {rule.isDefault ? '⭐ Default unlock' : `Tier ${i + 1}`}
            </KText>
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <KInput
                  label="Stars"
                  value={String(rule.starsRequired)}
                  onChangeText={(v) => updateRule(i, 'starsRequired', v)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <KInput
                  label="Minutes"
                  value={String(rule.minutesGranted)}
                  onChangeText={(v) => updateRule(i, 'minutesGranted', v)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <KText variant="caption" muted>
              {rule.starsRequired} stars = {rule.minutesGranted} minutes
              {rule.isDefault ? ' (used when unlocking apps)' : ''}
            </KText>
          </View>
        ))}

        <KButton
          label={isEditMode ? 'Save changes' : 'Continue'}
          size="lg"
          loading={saving}
          onPress={() => void onContinue()}
        />
        {isEditMode ? (
          <KButton
            label="Back to dashboard"
            variant="ghost"
            onPress={() => router.replace('/(parent)/(tabs)/dashboard')}
            style={{ marginTop: SPACING.sm }}
          />
        ) : null}
      </OnboardingShell>
    </KScreen>
  );
}
