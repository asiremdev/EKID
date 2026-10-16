import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PermissionBadge } from './StatusBadge';
import {
  SPACING,
  RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
} from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';
import type { PermissionState } from '../types';

interface PermissionCardProps {
  title: string;
  description: string;
  state: PermissionState;
  icon: string;
  required: boolean;
  onOpenSettings: () => void;
}

export function PermissionCard({
  title,
  description,
  state,
  icon,
  required,
  onOpenSettings,
}: PermissionCardProps) {
  const colors = useThemeColors();
  const isGranted = state === 'granted';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isGranted
            ? colors.success + '40'
            : required
            ? colors.error + '40'
            : colors.outline,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isGranted
                ? colors.success + '20'
                : colors.primary + '20',
            },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
            {required && (
              <View style={[styles.requiredTag, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.requiredText, { color: colors.error }]}>Required</Text>
              </View>
            )}
          </View>
          <PermissionBadge state={state} />
        </View>
      </View>

      <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
        {description}
      </Text>

      {!isGranted && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={onOpenSettings}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, { color: colors.onPrimary }]}>Open Settings</Text>
        </TouchableOpacity>
      )}

      {isGranted && (
        <View style={[styles.grantedRow, { backgroundColor: colors.success + '18' }]}>
          <Text style={{ fontSize: FONT_SIZE.sm }}>✓</Text>
          <Text style={[styles.grantedText, { color: colors.success }]}>
            Permission active
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  titleBlock: {
    flex: 1,
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  requiredTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  requiredText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  btn: {
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  grantedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  grantedText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});
