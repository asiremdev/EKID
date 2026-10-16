import React from 'react';
import { Image, ImageSourcePropType, ScrollView, View, StyleSheet } from 'react-native';
import { KText } from '../ui/KText';
import { SPACING, WLIDI, RADIUS, SHADOW } from '../../constants/theme';

interface GameShellProps {
  title: string;
  subtitle: string;
  worldLabel?: string;
  worldEmoji?: string;
  accent?: string;
  banner?: ImageSourcePropType;
  children: React.ReactNode;
}

export function GameShell({ title, subtitle, worldLabel, worldEmoji, accent, banner, children }: GameShellProps) {
  const tint = accent ?? WLIDI.teal;
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {banner ? <Image source={banner} style={styles.banner} resizeMode="cover" /> : null}
      {worldLabel ? (
        <View style={[styles.worldChip, { backgroundColor: `${tint}22`, borderColor: `${tint}66` }]}>
          <KText variant="label" color={tint}>
            {worldEmoji ? `${worldEmoji}  ` : ''}
            {worldLabel}
          </KText>
        </View>
      ) : null}
      <View style={[styles.header, { backgroundColor: WLIDI.white, borderColor: `${tint}55` }]}>
        <View style={[styles.headerBlob, { backgroundColor: `${tint}28` }]} />
        <KText variant="heading" center color={tint}>
          {title}
        </KText>
        <KText variant="caption" muted center style={styles.subtitle}>
          {subtitle}
        </KText>
      </View>
      <View style={[styles.play, { borderColor: `${tint}33` }]}>{children}</View>
    </ScrollView>
  );
}

export const gameOptionStyle = StyleSheet.create({
  option: {
    minWidth: 72,
    height: 72,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
    backgroundColor: WLIDI.white,
    borderWidth: 2,
    borderColor: WLIDI.mintDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: WLIDI.mint,
    borderColor: WLIDI.teal,
  },
  optionUsed: {
    backgroundColor: WLIDI.peachLight,
    borderColor: WLIDI.coral,
    opacity: 0.6,
  },
});

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  banner: {
    width: '100%',
    height: 92,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.sm,
    backgroundColor: WLIDI.mint,
  },
  worldChip: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  header: {
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  headerBlob: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 28,
    top: -24,
    right: -18,
    transform: [{ rotate: '18deg' }],
  },
  subtitle: {
    marginTop: SPACING.xs,
  },
  play: {
    backgroundColor: WLIDI.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    ...SHADOW.md,
  },
});
