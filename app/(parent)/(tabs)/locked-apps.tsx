import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../../components/ui/KScreen';
import { KText } from '../../../components/ui/KText';
import { KButton } from '../../../components/ui/KButton';
import { KCard } from '../../../components/ui/KCard';
import { SPACING, WLIDI, RADIUS } from '../../../constants/theme';
import { useLockingStore } from '../../../store/useLockingStore';
import { Ionicons } from '@expo/vector-icons';

export default function LockedAppsTab() {
  const router = useRouter();
  const protectedApps = useLockingStore((s) => s.syncBundle?.protectedApps ?? []);
  const protectionActive = useLockingStore((s) => s.protectionActive);

  return (
    <KScreen>
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={28} color={WLIDI.teal} />
        <KText variant="heading" style={{ marginLeft: SPACING.sm }}>
          Locked Apps
        </KText>
      </View>

      <KCard color={protectionActive ? WLIDI.mint : WLIDI.peachLight} style={{ marginBottom: SPACING.lg }}>
        <KText variant="label">{protectionActive ? '🛡️ Blocking is ON' : 'Blocking is OFF'}</KText>
        <KText variant="caption" muted style={{ marginTop: 4 }}>
          {protectionActive
            ? 'These apps are locked on your child\'s device right now.'
            : 'Turn blocking ON from the Dashboard to enforce locks.'}
        </KText>
      </KCard>

      <KText variant="label" style={{ marginBottom: SPACING.sm }}>
        {protectedApps.length} app{protectedApps.length === 1 ? '' : 's'} blocked
      </KText>

      {protectedApps.length === 0 ? (
        <KCard color={WLIDI.white}>
          <KText variant="body" muted center>
            No apps blocked yet. Tap below to choose apps.
          </KText>
        </KCard>
      ) : (
        protectedApps.map((a) => (
          <KCard key={a.packageName} color={WLIDI.white} style={styles.appRow}>
            <View style={styles.appIcon}>
              <Ionicons name="apps" size={20} color={WLIDI.teal} />
            </View>
            <KText variant="body" style={{ flex: 1 }}>
              {a.appLabel ?? a.packageName}
            </KText>
            <Ionicons name="lock-closed" size={18} color={WLIDI.coral} />
          </KCard>
        ))
      )}

      <KButton
        label="Edit blocked apps"
        variant="coral"
        onPress={() => router.push('/(parent)/edit-apps')}
        style={{ marginTop: SPACING.xl }}
      />
      <KButton
        label="Edit reward rules"
        variant="sky"
        onPress={() => router.push('/(parent)/edit-rules')}
        style={{ marginTop: SPACING.sm }}
      />
    </KScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: WLIDI.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
