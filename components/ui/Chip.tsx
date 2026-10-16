import React from 'react';
import { Pressable } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from './KText';

interface ChipProps {
  label: string;
  emoji?: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
}

export function Chip({ label, emoji, active, color, onPress }: ChipProps) {
  const colors = useThemeColors();
  const accent = color ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.xs + 2,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.full,
        backgroundColor: active ? accent : colors.surfaceVariant,
        borderWidth: 1,
        borderColor: active ? accent : colors.outline,
        marginRight: SPACING.sm,
        marginBottom: SPACING.sm,
      }}
    >
      {emoji ? <KText style={{ marginRight: 6 }}>{emoji}</KText> : null}
      <KText variant="label" color={active ? '#FFFFFF' : colors.onSurfaceVariant}>
        {label}
      </KText>
    </Pressable>
  );
}
