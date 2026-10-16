import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PermissionState, LockStatus } from '../types';
import { SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';

// ─── Permission Badge ─────────────────────────────────────────────────────────

interface PermissionBadgeProps {
  state: PermissionState;
}

export function PermissionBadge({ state }: PermissionBadgeProps) {
  const colors = useThemeColors();

  const config = {
    granted: { label: 'Granted', bg: colors.success + '28', fg: colors.success },
    denied: { label: 'Missing', bg: colors.error + '28', fg: colors.error },
    unknown: { label: 'Unknown', bg: colors.warning + '28', fg: colors.warning },
  }[state];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.fg }]} />
      <Text style={[styles.label, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

// ─── Lock Status Badge ────────────────────────────────────────────────────────

interface LockBadgeProps {
  status: LockStatus;
}

export function LockBadge({ status }: LockBadgeProps) {
  const colors = useThemeColors();

  const config = {
    locked: { label: 'Locked', bg: colors.error + '28', fg: colors.error },
    unlocked: { label: 'Unlocked', bg: colors.success + '28', fg: colors.success },
    'timer-unlocked': {
      label: 'Temporarily Unlocked',
      bg: colors.warning + '28',
      fg: colors.warning,
    },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.fg }]} />
      <Text style={[styles.label, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
