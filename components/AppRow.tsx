import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppIcon } from './AppIcon';
import { SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';
import { useAppLockStore } from '../store/useAppLockStore';
import type { InstalledApp } from '../types';

interface AppRowProps {
  app: InstalledApp;
  onToggleLock: (packageName: string) => void;
}

export const AppRow = memo(function AppRow({ app, onToggleLock }: AppRowProps) {
  const colors = useThemeColors();
  const isLocked = useAppLockStore((s) => !!s.lockedApps[app.packageName]);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
      <AppIcon appName={app.appName} packageName={app.packageName} size={44} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
          {app.appName}
        </Text>
        <Text style={[styles.pkg, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {app.packageName}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.btn,
          {
            backgroundColor: isLocked ? colors.error + '18' : colors.primary + '18',
            borderColor: isLocked ? colors.error : colors.primary,
          },
        ]}
        onPress={() => onToggleLock(app.packageName)}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, { color: isLocked ? colors.error : colors.primary }]}>
          {isLocked ? 'Unlock' : 'Lock'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    marginHorizontal: SPACING.md,
    marginVertical: 3,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 72,
  },
  info: { flex: 1 },
  name: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  pkg: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    minWidth: 72,
    alignItems: 'center',
  },
  btnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
});
