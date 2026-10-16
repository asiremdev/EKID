import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const COLORS = ['#FF6FA5', '#FFC53D', '#4FC3F7', '#5FD068', '#7C6FF7', '#FF8A3D'];

function Piece({ index }: { index: number }) {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const startX = (index * 37) % width;
  const drift = ((index % 5) - 2) * 30;
  const duration = 2200 + (index % 7) * 250;
  const delay = (index % 10) * 120;
  const color = COLORS[index % COLORS.length];
  const size = 8 + (index % 3) * 4;

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(height + 60, { duration, easing: Easing.in(Easing.quad) }));
    translateX.value = withDelay(delay, withRepeat(withTiming(drift, { duration: 700 }), -1, true));
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1));
  }, [translateY, translateX, rotate, delay, drift, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: 0,
          width: size,
          height: size * 1.6,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function Confetti({ count = 70, active = true }: { count?: number; active?: boolean }) {
  if (!active) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, i) => (
        <Piece key={i} index={i} />
      ))}
    </View>
  );
}
