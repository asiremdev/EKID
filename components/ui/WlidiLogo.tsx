import React, { memo } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { IMAGES } from '../../constants/assets';

interface WlidiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const SIZES = { sm: 72, md: 100, lg: 130 };

function WlidiLogoInner({ size = 'md', style }: WlidiLogoProps) {
  const dim = SIZES[size];
  return (
    <View style={[styles.wrap, style]}>
      <Image source={IMAGES.logo} style={{ width: dim, height: dim * 0.85 }} resizeMode="contain" />
    </View>
  );
}

export const WlidiLogo = memo(WlidiLogoInner);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
});
