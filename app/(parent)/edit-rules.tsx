import React, { useEffect, useState } from 'react';
import { View, Alert, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { KInput } from '../../components/ui/KInput';
import { KCard } from '../../components/ui/KCard';
import { FoxAvatar } from '../../components/ui/WlidiDecor';
import { SPACING, WLIDI, RADIUS } from '../../constants/theme';
import { useChildStore } from '../../store/useChildStore';
import { useMyChild, useSetRewardRules } from '../../hooks/api/useProtectionApi';
import { KiddySync } from '../../services/KiddySync';
import { ApiError } from '../../lib/api/client';
import { useLockingStore } from '../../store/useLockingStore';
import type { RewardRuleRecord } from '../../lib/api/protection-types';

const DEFAULT_RULES = [
  { starsRequired: 20, minutesGranted: 30, isDefault: true },
  { starsRequired: 30, minutesGranted: 50, isDefault: false },
  { starsRequired: 100, minutesGranted: 180, isDefault: false },
];

export default function EditRulesScreen() {
  const router = useRouter();
  const child = useChildStore((s) => s.child);
  const { data: myChild } = useMyChild();
  const childId = child?.id ?? myChild?.id ?? '';
  const profile = child ?? myChild;
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

  const onSave = async () => {
    if (!childId) {
      Alert.alert('No child profile', 'Please create your child profile first.');
      return;
    }

    setSaving(true);
    try {
      const saved = await setRules.mutateAsync(rules.map((r, i) => ({ ...r, sortOrder: i })));
      try {
        await KiddySync.pull(childId);
      } catch {
        await KiddySync.applyRulesLocally(childId, saved as RewardRuleRecord[]);
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Could not save reward rules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KScreen>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={WLIDI.text} />
      </Pressable>

      <View style={styles.titleRow}>
        <FoxAvatar size={48} />
        <KText variant="heading" style={{ marginLeft: SPACING.sm }}>
          Reward Rules for {profile?.name ?? 'Child'}
        </KText>
      </View>

      {rules.map((rule, i) => (
        <KCard key={i} color={WLIDI.white} style={{ marginBottom: SPACING.md }}>
          <KText variant="label" color={WLIDI.teal} style={{ marginBottom: SPACING.sm }}>
            {rule.isDefault ? 'Default Unlock' : `Tier ${i + 1}`}
          </KText>
          <View style={styles.inputsRow}>
            <View style={styles.inputCol}>
              <KText variant="caption" muted>
                ⭐ Stars
              </KText>
              <KInput
                value={String(rule.starsRequired)}
                onChangeText={(v) => updateRule(i, 'starsRequired', v)}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.inputCol}>
              <KText variant="caption" muted>
                🕐 Minutes
              </KText>
              <KInput
                value={String(rule.minutesGranted)}
                onChangeText={(v) => updateRule(i, 'minutesGranted', v)}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <KText variant="caption" muted style={{ marginTop: SPACING.sm }}>
            {rule.starsRequired} stars = {rule.minutesGranted} minutes
          </KText>
        </KCard>
      ))}

      <KButton label="Save rules" size="lg" loading={saving} onPress={() => void onSave()} />
    </KScreen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: WLIDI.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: WLIDI.outline,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputCol: { flex: 1 },
});
