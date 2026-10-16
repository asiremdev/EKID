import React, { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { RADIUS, SPACING } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';
import { KText } from './KText';

interface KInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
}

export function KInput({ label, error, icon, style, ...rest }: KInputProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label ? (
        <KText variant="label" muted style={{ marginBottom: SPACING.xs }}>
          {label}
        </KText>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: RADIUS.lg,
          borderWidth: 2,
          borderColor: error ? colors.error : focused ? colors.primary : colors.outline,
          paddingHorizontal: SPACING.md,
        }}
      >
        {icon ? <KText style={{ marginRight: SPACING.sm }}>{icon}</KText> : null}
        <TextInput
          placeholderTextColor={colors.onSurfaceVariant}
          style={[{ flex: 1, paddingVertical: SPACING.md, color: colors.onSurface, fontSize: 16 }, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
      </View>
      {error ? (
        <KText variant="caption" color={colors.error} style={{ marginTop: SPACING.xs }}>
          {error}
        </KText>
      ) : null}
    </View>
  );
}
