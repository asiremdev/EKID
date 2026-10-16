import React, { useState } from 'react';
import { View, Switch, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../../components/ui/KScreen';
import { KText } from '../../../components/ui/KText';
import { KButton } from '../../../components/ui/KButton';
import { KCard } from '../../../components/ui/KCard';
import { FoxAvatar, StarBadge } from '../../../components/ui/WlidiDecor';
import { SPACING, WLIDI, RADIUS } from '../../../constants/theme';
import { ageGroupMeta } from '../../../constants/design';
import { Chip } from '../../../components/ui/Chip';
import { useChildren } from '../../../hooks/api/useChildrenApi';
import { useAuthStore } from '../../../store/useAuthStore';
import { useChildStore } from '../../../store/useChildStore';
import { useLockingStore } from '../../../store/useLockingStore';
import { useSetProtectionActive, useSyncBundle } from '../../../hooks/api/useProtectionApi';
import { api } from '../../../lib/api/client';

export default function ParentDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const child = useChildStore((s) => s.child);
  const protectionActive = useLockingStore((s) => s.protectionActive);
  const syncBundle = useLockingStore((s) => s.syncBundle);

  const setChild = useChildStore((s) => s.setChild);
  const { data: children, refetch, isRefetching } = useChildren();
  const profile = child ?? children?.[0];
  const setProtection = useSetProtectionActive(profile?.id ?? '');
  useSyncBundle(profile?.id ?? null);

  const [pairing, setPairing] = useState<{ paired: boolean; lastSyncAt: string | null } | null>(null);

  React.useEffect(() => {
    void api
      .get<{ paired: boolean; lastSyncAt: string | null }>('/parents/me/pairing/status', { childId: profile?.id })
      .then(setPairing);
  }, [profile?.id]);

  const toggleProtection = async (active: boolean) => {
    if (!profile?.id) return;
    if (active && !pairing?.paired) {
      Alert.alert(
        'Pair device first',
        'Install WLIDI on the child tablet, choose "Child\'s tablet", and enter the pairing code.',
      );
      return;
    }
    await setProtection.mutateAsync(active);
  };

  const protectedApps = syncBundle?.protectedApps ?? [];
  const ageMeta = profile?.ageGroup ? ageGroupMeta(profile.ageGroup) : null;

  return (
    <KScreen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={WLIDI.teal} />}>
      <KText variant="display" style={styles.greeting}>
        Hello {user?.name?.split(' ')[0] ?? 'Parent'}!
      </KText>

      <KCard color={WLIDI.white} style={styles.blockCard}>
        <View style={styles.blockRow}>
          <View style={{ flex: 1 }}>
            <KText variant="title">Blocking ON/OFF</KText>
            <KText variant="caption" muted style={{ marginTop: 4 }}>
              {protectionActive
                ? "Turn blocking OFF to let your child's device run freely."
                : 'Turn blocking ON to start protection.'}
            </KText>
          </View>
          <Switch
            value={protectionActive}
            onValueChange={toggleProtection}
            disabled={setProtection.isPending}
            trackColor={{ false: WLIDI.outline, true: WLIDI.tealLight }}
            thumbColor={protectionActive ? WLIDI.teal : WLIDI.white}
          />
        </View>
      </KCard>

      {children && children.length > 1 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.md }}>
          {children.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={profile?.id === c.id}
              onPress={() => setChild(c)}
            />
          ))}
        </View>
      ) : null}

      {profile ? (
        <KCard color={WLIDI.skyBlue} style={styles.childCard}>
          <View style={styles.childRow}>
            <FoxAvatar size={56} />
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <KText variant="title">{profile.name}</KText>
              <KText variant="caption" muted>
                {ageMeta?.game ?? 'Game'} · {ageMeta?.range ?? '—'} yrs
              </KText>
              <StarBadge stars={profile.stars ?? 0} style={{ marginTop: SPACING.sm, alignSelf: 'flex-start' }} />
            </View>
          </View>
          <KText variant="caption" muted style={{ marginTop: SPACING.sm }}>
            last sync {pairing?.lastSyncAt ? new Date(pairing.lastSyncAt).toLocaleDateString() : '—'}
          </KText>
        </KCard>
      ) : null}

      <KCard color={WLIDI.peachLight} style={styles.blockedCard}>
        <KText variant="label" color={WLIDI.coralDark}>
          Blocked apps ({protectedApps.length})
        </KText>
        {protectedApps.length === 0 ? (
          <KText variant="body" muted style={{ marginTop: SPACING.sm }}>
            No apps blocked yet
          </KText>
        ) : (
          protectedApps.slice(0, 4).map((a) => (
            <View key={a.packageName} style={styles.appChip}>
              <KText variant="body">{a.appLabel ?? a.packageName}</KText>
            </View>
          ))
        )}
      </KCard>

      <KButton
        label="Edit blocked apps"
        variant="mint"
        onPress={() => router.push('/(parent)/edit-apps')}
        style={{ marginTop: SPACING.lg }}
      />
      <KButton
        label="Edit reward rules"
        variant="sky"
        onPress={() => router.push('/(parent)/edit-rules')}
        style={{ marginTop: SPACING.sm }}
      />
      <KButton
        label="Re-pair child device"
        variant="white"
        onPress={() => router.push('/onboarding/pair-device')}
        style={{ marginTop: SPACING.sm }}
      />
    </KScreen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: SPACING.lg,
    color: WLIDI.text,
    fontWeight: '700',
  },
  blockCard: {
    marginBottom: SPACING.md,
    borderColor: WLIDI.teal,
    borderWidth: 1.5,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childCard: {
    marginBottom: SPACING.md,
    borderColor: WLIDI.skyBlueDark,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockedCard: {
    marginBottom: SPACING.sm,
    borderColor: WLIDI.peach,
  },
  appChip: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: WLIDI.white,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
});
