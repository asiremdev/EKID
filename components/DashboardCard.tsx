import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  SPACING,
  RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
} from '../constants/theme';
import { useThemeColors } from '../constants/ThemeContext';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  accentColor?: string;
  onPress?: () => void;
}

export function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  onPress,
}: DashboardCardProps) {
  const colors = useThemeColors();
  const accent = accentColor ?? colors.primary;

  const Inner = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: accent + '30',
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.onSurfaceVariant }]}>{title}</Text>
        <Text style={[styles.value, { color: accent }]}>{value}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {Inner}
      </TouchableOpacity>
    );
  }

  return Inner;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minWidth: 140,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
  },
});
