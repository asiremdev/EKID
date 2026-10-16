import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { RADIUS } from '../../constants/theme';
import { useThemeColors } from '../../constants/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0..1
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({ progress, height = 12, color, trackColor, style }: ProgressBarProps) {
  const colors = useThemeColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 600 });
  }, [progress, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      style={[
        { height, borderRadius: RADIUS.full, backgroundColor: trackColor ?? colors.surfaceVariant, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={[{ height: '100%', borderRadius: RADIUS.full, backgroundColor: color ?? colors.primary }, fillStyle]}
      />
    </View>
  );
}
