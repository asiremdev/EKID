import React from 'react';
import { Pressable, View, ViewStyle, StyleSheet } from 'react-native';
import { RADIUS, SHADOW, SPACING, WLIDI } from '../../constants/theme';

interface KCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  color?: string;
  padded?: boolean;
  elevated?: boolean;
}

export function KCard({ children, onPress, style, color, padded = true, elevated = true }: KCardProps) {
  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: color ?? WLIDI.white,
          padding: padded ? SPACING.md : 0,
        },
        elevated && SHADOW.sm,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: WLIDI.outline,
  },
});
