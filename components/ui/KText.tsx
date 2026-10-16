import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';

const VARIANT_STYLE: Record<Variant, TextStyle> = {
  display: { fontSize: FONT_SIZE.display, fontWeight: FONT_WEIGHT.bold },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold },
  heading: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold },
  body: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.regular },
  caption: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.regular },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
};

interface KTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  center?: boolean;
}

export function KText({ variant = 'body', color, muted, center, style, ...rest }: KTextProps) {
  const colors = useThemeColors();
  const resolved = color ?? (muted ? colors.onSurfaceVariant : colors.onSurface);
  return (
    <Text
      style={[VARIANT_STYLE[variant], { color: resolved }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
