import React from 'react';
import { Pressable } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from '../ui/KText';

type State = 'idle' | 'correct' | 'wrong' | 'selected';

interface OptionButtonProps {
  label: string;
  onPress?: () => void;
  state?: State;
  big?: boolean;
  disabled?: boolean;
}

export function OptionButton({ label, onPress, state = 'idle', big, disabled }: OptionButtonProps) {
  const colors = useThemeColors();

  const bg =
    state === 'correct'
      ? colors.success + '33'
      : state === 'wrong'
        ? colors.error + '33'
        : state === 'selected'
          ? colors.primaryContainer
          : colors.surface;
  const border =
    state === 'correct'
      ? colors.success
      : state === 'wrong'
        ? colors.error
        : state === 'selected'
          ? colors.primary
          : colors.outline;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 2,
        borderRadius: RADIUS.lg,
        paddingVertical: big ? SPACING.xl : SPACING.md,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        alignItems: 'center',
        transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
      })}
    >
      <KText variant={big ? 'display' : 'heading'} center>
        {label}
        {state === 'correct' ? '  ✅' : state === 'wrong' ? '  ❌' : ''}
      </KText>
    </Pressable>
  );
}
