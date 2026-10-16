import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS_DARK } from '../../constants/theme';

/** Decorative ambient glow for child-device screens. */
export function GlowBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: COLORS_DARK.primary,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 120,
          left: -80,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: COLORS_DARK.secondary,
          opacity: 0.12,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '40%',
          left: '30%',
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: COLORS_DARK.warning,
          opacity: 0.06,
        }}
      />
    </View>
  );
}
