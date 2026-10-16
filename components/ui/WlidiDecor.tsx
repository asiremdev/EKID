import React, { memo } from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';
import { IMAGES } from '../../constants/assets';
import { RADIUS, SPACING, WLIDI } from '../../constants/theme';
import { KText } from './KText';

interface StarBadgeProps {
  stars: number;
  style?: ViewStyle;
  large?: boolean;
}

function StarBadgeInner({ stars, style, large }: StarBadgeProps) {
  return (
    <View style={[styles.badge, large && styles.badgeLarge, style]}>
      <KText style={styles.star}>⭐</KText>
      <KText variant={large ? 'title' : 'label'} color={WLIDI.text}>
        {stars}
      </KText>
      {large ? <KText style={styles.star}>⭐</KText> : null}
    </View>
  );
}

export const StarBadge = memo(StarBadgeInner);

interface FoxAvatarProps {
  size?: number;
  style?: ImageStyle;
}

function FoxAvatarInner({ size = 72, style }: FoxAvatarProps) {
  return (
    <Image
      source={IMAGES.foxAvatar}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      resizeMode="cover"
    />
  );
}

export const FoxAvatar = memo(FoxAvatarInner);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: WLIDI.white,
    borderWidth: 1,
    borderColor: WLIDI.outline,
  },
  badgeLarge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  star: {
    fontSize: 18,
  },
});
