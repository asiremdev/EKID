import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { KScreen } from '../../components/ui/KScreen';
import { KText } from '../../components/ui/KText';
import { KButton } from '../../components/ui/KButton';
import { SPACING, COLORS_DARK } from '../../constants/theme';
import { GlowBackground } from '../../components/ui/GlowBackground';
import { usePermissions } from '../../hooks/usePermissions';
import { usePermissionsStatus } from '../../store/useAppLockStore';
import { REQUIRED_PERMISSIONS, getMissingPermissions, refreshAndCheckPermissions } from '../../lib/permissions';
import { PermissionCard } from '../../components/PermissionCard';
import { AppLockBridge } from '../../services/AppLockBridge';
import { deviceApi } from '../../lib/deviceApi';
import { WlidiSync } from '../../services/WlidiSync';

export default function DevicePermissionsScreen() {
  const router = useRouter();
  const permissionsStatus = usePermissionsStatus();
  const { refresh, openSettings } = usePermissions();
  const [syncing, setSyncing] = useState(false);
  const missing = getMissingPermissions(permissionsStatus);
  const allGranted = missing.length === 0;

  useEffect(() => {
    void refreshAndCheckPermissions();
  }, []);

  const syncAppsAndContinue = async () => {
    setSyncing(true);
    try {
      const installed = await AppLockBridge.getInstalledApps();
      const userApps = installed.filter(
        (a) => !a.packageName.startsWith('com.android.') && a.packageName !== 'com.wlidi.app',
      );
      await deviceApi.reportInstalledApps(
        userApps.map((a) => ({ packageName: a.packageName, appLabel: a.appName })),
      );
      // Pull latest rules and push to native before child uses the device.
      try {
        await WlidiSync.pull();
      } catch {
        // Continue — periodic sync will retry.
      }
      router.replace('/(device)/home');
    } catch {
      router.replace('/(device)/home');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <KScreen scroll={false} style={{ backgroundColor: COLORS_DARK.background }}>
      <GlowBackground />
      <View style={{ flex: 1, padding: SPACING.lg, paddingTop: SPACING.xxl }}>
        <KText variant="title" center color={COLORS_DARK.onBackground}>
          Allow permissions
        </KText>
        <KText variant="body" muted center style={{ marginTop: SPACING.sm, marginBottom: SPACING.lg, lineHeight: 22 }}>
          WLIDI needs these on the child's phone to block apps safely.
        </KText>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: SPACING.lg }}>
          {REQUIRED_PERMISSIONS.map((p) => (
            <View key={p.key} style={{ marginBottom: SPACING.sm }}>
              <PermissionCard
                icon={p.icon}
                title={p.title}
                description={p.description}
                state={permissionsStatus[p.key]}
                required
                onOpenSettings={() => openSettings(p.key)}
              />
            </View>
          ))}
        </ScrollView>

        <KButton label="Refresh" variant="ghost" onPress={() => void refresh()} style={{ marginBottom: SPACING.sm }} />

        {allGranted ? (
          <KButton
            label={syncing ? 'Syncing apps…' : 'Continue'}
            size="lg"
            loading={syncing}
            onPress={() => void syncAppsAndContinue()}
          />
        ) : (
          <KText variant="caption" muted center>
            Grant every permission above to continue
          </KText>
        )}
      </View>
    </KScreen>
  );
}
