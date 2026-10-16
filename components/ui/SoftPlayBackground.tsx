import React, { memo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { IMAGES } from '../../constants/assets';
import { WLIDI } from '../../constants/theme';

function SoftPlayBackgroundInner() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ImageBackground source={IMAGES.softPlayBg} style={styles.bg} resizeMode="cover" />
      <View style={[styles.block, styles.blockMint]} />
      <View style={[styles.block, styles.blockCoral]} />
      <View style={[styles.block, styles.blockBlue]} />
    </View>
  );
}

export const SoftPlayBackground = memo(SoftPlayBackgroundInner);

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  block: {
    position: 'absolute',
    borderRadius: 8,
    opacity: 0.35,
  },
  blockMint: {
    width: 28,
    height: 28,
    backgroundColor: WLIDI.mintDark,
    top: '18%',
    left: '8%',
    transform: [{ rotate: '15deg' }],
  },
  blockCoral: {
    width: 22,
    height: 22,
    backgroundColor: WLIDI.coral,
    bottom: '22%',
    right: '10%',
    transform: [{ rotate: '-12deg' }],
  },
  blockBlue: {
    width: 18,
    height: 18,
    backgroundColor: WLIDI.skyBlueDark,
    top: '42%',
    right: '6%',
    transform: [{ rotate: '25deg' }],
  },
});
