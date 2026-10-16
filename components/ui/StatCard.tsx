import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SPACING } from '../../constants/theme';
import { KCard } from './KCard';
import { KText } from './KText';

interface StatCardProps {
  emoji: string;
  value: string | number;
  label: string;
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export function StatCard({ emoji, value, label, color, style, onPress }: StatCardProps) {
  return (
    <KCard onPress={onPress} style={style} color={color ? color + '22' : undefined}>
      <View style={{ alignItems: 'flex-start' }}>
        <KText style={{ fontSize: 28, marginBottom: SPACING.xs }}>{emoji}</KText>
        <KText variant="title" color={color}>
          {value}
        </KText>
        <KText variant="caption" muted>
          {label}
        </KText>
      </View>
    </KCard>
  );
}
