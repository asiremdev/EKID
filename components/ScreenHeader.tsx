import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  SPACING,
  RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const ScreenHeader = memo(function ScreenHeader({
  title,
  subtitle,
  action,
}: ScreenHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrap}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.onBackground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <TouchableOpacity
          style={[styles.action, { backgroundColor: colors.primary }, SHADOW.sm]}
          onPress={action.onPress}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionText, { color: colors.onPrimary }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  textBlock: { flex: 1, gap: 4 },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  action: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
});
