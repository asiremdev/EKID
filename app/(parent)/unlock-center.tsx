import React, { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KCard } from '../../components/ui/KCard';
import { KButton } from '../../components/ui/KButton';
import { Chip } from '../../components/ui/Chip';
import { RemainingTime, useRemainingSeconds } from '../../components/RemainingTime';
import { SPACING, RADIUS } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { UNLOCK_DURATIONS, starCost, appEmoji } from '../../constants/unlock';
import { useLockedAppsList, useAppLockStore } from '../../store/useAppLockStore';
import { useSelectedChild } from '../../components/useSelectedChild';
import { useChild } from '../../hooks/api/useChildrenApi';
import { useUnlockAppTime } from '../../hooks/api/useStarsApi';
import type { LockedApp } from '../../types';

export default function UnlockCenter() {
  const colors = useThemeColors();
  const router = useRouter();
  const lockedApps = useLockedAppsList();
  const child = useSelectedChild();
  const { data: childData } = useChild(child?.id ?? null);
  const stars = childData?.stars ?? child?.stars ?? 0;

  return (
    <KScreen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <KText style={{ fontSize: 26, marginRight: SPACING.sm }}>‹</KText>
        </Pressable>
        <View style={{ flex: 1 }}>
          <KText variant="title">Unlock Center</KText>
          <KText variant="caption" muted>
            Spend stars for screen time
          </KText>
        </View>
        <KText variant="title" color={colors.warning}>
          ⭐ {stars}
        </KText>
      </View>

      {lockedApps.length === 0 ? (
        <KCard style={{ marginTop: SPACING.xl }} onPress={() => router.push('/(tabs)')}>
          <KText variant="heading">No locked apps yet</KText>
          <KText variant="caption" muted style={{ marginTop: SPACING.xs }}>
            Tap to choose apps to lock (YouTube, TikTok, Roblox…)
          </KText>
        </KCard>
      ) : (
        <View style={{ marginTop: SPACING.lg }}>
          {lockedApps.map((app) => (
            <UnlockCard key={app.packageName} app={app} childId={child?.id ?? null} stars={stars} />
          ))}
        </View>
      )}
    </KScreen>
  );
}

function UnlockCard({ app, childId, stars }: { app: LockedApp; childId: string | null; stars: number }) {
  const colors = useThemeColors();
  const [minutes, setMinutes] = useState(UNLOCK_DURATIONS[0]);
  const unlockNative = useAppLockStore((s) => s.unlockApp);
  const relockNative = useAppLockStore((s) => s.relockApp);
  const spendUnlock = useUnlockAppTime(childId ?? '');

  const remaining = useRemainingSeconds(app.unlockExpiresAt);
  const isActive = app.status === 'timer-unlocked' && remaining > 0;
  const cost = starCost(minutes);
  const canAfford = stars >= cost;

  const doUnlock = async () => {
    if (!childId) {
      Alert.alert('Select a child', 'Choose a child profile first.');
      return;
    }
    if (!canAfford) {
      Alert.alert('Not enough stars', `${app.appName} needs ${cost} ⭐. Earn more by learning!`);
      return;
    }
    try {
      await spendUnlock.mutateAsync({ appPackage: app.packageName, appLabel: app.appName, minutes });
      await unlockNative(app.packageName, minutes);
      Alert.alert('Unlocked! 🎉', `${app.appName} is open for ${minutes} minutes.`);
    } catch {
      Alert.alert('Error', 'Could not unlock. Please try again.');
    }
  };

  return (
    <KCard style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: colors.surfaceVariant,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.md,
          }}
        >
          <KText style={{ fontSize: 26 }}>{appEmoji(app.packageName, app.appName)}</KText>
        </View>
        <View style={{ flex: 1 }}>
          <KText variant="heading">{app.appName}</KText>
          {isActive ? (
            <RemainingTime expiresAt={app.unlockExpiresAt} color={colors.success} />
          ) : (
            <KText variant="caption" color={colors.error}>
              🔒 Locked
            </KText>
          )}
        </View>
      </View>

      {isActive ? (
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
          <KButton
            label="+ Extend"
            size="sm"
            variant="secondary"
            onPress={() => unlockNative(app.packageName, minutes)}
            style={{ flex: 1 }}
          />
          <KButton
            label="Relock now"
            size="sm"
            variant="danger"
            onPress={() => relockNative(app.packageName)}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.md }}>
            {UNLOCK_DURATIONS.map((d) => (
              <Chip
                key={d}
                label={`${d} min`}
                active={minutes === d}
                onPress={() => setMinutes(d)}
              />
            ))}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.surfaceVariant,
              borderRadius: RADIUS.lg,
              padding: SPACING.md,
              marginTop: SPACING.sm,
            }}
          >
            <KText variant="caption" muted>
              Cost
            </KText>
            <KText variant="heading" color={canAfford ? colors.warning : colors.error}>
              {cost} ⭐
            </KText>
          </View>
          <KButton
            label={canAfford ? `Unlock for ${minutes} min` : 'Not enough stars'}
            disabled={!canAfford}
            loading={spendUnlock.isPending}
            onPress={doUnlock}
            style={{ marginTop: SPACING.md }}
          />
        </>
      )}
    </KCard>
  );
}
