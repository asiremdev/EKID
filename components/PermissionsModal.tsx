import React from 'react';
import { Modal, View, ScrollView } from 'react-native';
import { SPACING } from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';
import { usePermissionsStatus } from '../store/useAppLockStore';
import { REQUIRED_PERMISSIONS, getMissingPermissions } from '../lib/permissions';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionCard } from './PermissionCard';
import { KText } from './ui/KText';
import { KButton } from './ui/KButton';

interface PermissionsModalProps {
  visible: boolean;
  onDismiss?: () => void;
  onAllGranted?: () => void;
}

/** Blocking popup when required Android permissions were revoked. */
export function PermissionsModal({ visible, onDismiss, onAllGranted }: PermissionsModalProps) {
  const colors = useThemeColors();
  const permissionsStatus = usePermissionsStatus();
  const { refresh, openSettings } = usePermissions();
  const missing = getMissingPermissions(permissionsStatus);
  const allGranted = missing.length === 0;

  React.useEffect(() => {
    if (visible && allGranted) {
      onAllGranted?.();
    }
  }, [visible, allGranted, onAllGranted]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: colors.background, padding: SPACING.lg, paddingTop: SPACING.xxl }}>
        <KText style={{ fontSize: 48, textAlign: 'center' }}>⚠️</KText>
        <KText variant="title" center style={{ marginTop: SPACING.md }}>
          Permissions required
        </KText>
        <KText variant="body" muted center style={{ marginTop: SPACING.xs, lineHeight: 22 }}>
          Kiddy needs these permissions to lock apps and protect your child. Grant any missing ones below.
        </KText>

        <ScrollView style={{ flex: 1, marginTop: SPACING.lg }} showsVerticalScrollIndicator={false}>
          {(missing.length > 0 ? missing : REQUIRED_PERMISSIONS).map((p) => (
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

        <KButton label="Refresh status" variant="ghost" onPress={() => void refresh()} />
        {allGranted ? (
          <KButton label="Continue" size="lg" onPress={onDismiss} style={{ marginTop: SPACING.sm }} />
        ) : (
          <KText variant="caption" color={colors.warning} center style={{ marginTop: SPACING.sm }}>
            {missing.length} permission{missing.length === 1 ? '' : 's'} still missing
          </KText>
        )}
      </View>
    </Modal>
  );
}
