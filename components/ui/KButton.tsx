import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { RADIUS, SPACING, WLIDI } from '../../constants/theme';
import { KText } from './KText';

type Variant =
  | 'coral'
  | 'mint'
  | 'sky'
  | 'teal'
  | 'ghost'
  | 'white'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

interface KButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconRight?: string;
  full?: boolean;
  style?: ViewStyle;
}

const HEIGHT: Record<Size, number> = { sm: 44, md: 52, lg: 58 };

const BG: Record<Variant, string> = {
  coral: WLIDI.coral,
  mint: WLIDI.mintDark,
  sky: WLIDI.skyBlue,
  teal: WLIDI.teal,
  ghost: 'transparent',
  white: WLIDI.white,
  primary: WLIDI.teal,
  secondary: WLIDI.skyBlue,
  success: WLIDI.teal,
  danger: '#E53935',
  whatsapp: '#25D366',
};

const FG: Record<Variant, string> = {
  coral: WLIDI.white,
  mint: WLIDI.text,
  sky: WLIDI.text,
  teal: WLIDI.white,
  ghost: WLIDI.teal,
  white: WLIDI.teal,
  primary: WLIDI.white,
  secondary: WLIDI.text,
  success: WLIDI.white,
  danger: WLIDI.white,
  whatsapp: WLIDI.white,
};

export function KButton({
  label,
  onPress,
  variant = 'coral',
  size = 'md',
  disabled,
  loading,
  icon,
  iconRight,
  full = true,
  style,
}: KButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHT[size],
          backgroundColor: BG[variant],
          borderColor: variant === 'ghost' || variant === 'white' ? WLIDI.outline : 'transparent',
          borderWidth: variant === 'ghost' || variant === 'white' ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
          alignSelf: full ? 'stretch' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <View style={styles.row}>
          {icon ? <KText style={styles.icon}>{icon}</KText> : null}
          <KText variant="label" color={FG[variant]} style={{ fontSize: size === 'lg' ? 17 : 15, fontWeight: '700' }}>
            {label}
          </KText>
          {iconRight ? <KText style={styles.icon}>{iconRight}</KText> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  icon: { fontSize: 18 },
});
