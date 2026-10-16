import type { KiddyColors } from '../types';

/** WLIDI Soft Play palette — light, bubbly, kid-friendly */
export const WLIDI = {
  teal: '#00796B',
  tealLight: '#4DB6AC',
  coral: '#FF8A65',
  coralDark: '#FF7043',
  mint: '#E0F2F1',
  mintDark: '#B2DFDB',
  skyBlue: '#B3E5FC',
  skyBlueDark: '#81D4FA',
  peach: '#FFE0B2',
  peachLight: '#FFF3E0',
  starGold: '#FFD54F',
  cream: '#F5FAFA',
  white: '#FFFFFF',
  text: '#263238',
  textMuted: '#78909C',
  outline: '#CFD8DC',
} as const;

export const COLORS_DARK: KiddyColors = {
  primary: WLIDI.teal,
  primaryContainer: '#004D40',
  secondary: WLIDI.coral,
  secondaryContainer: '#BF360C',
  background: WLIDI.cream,
  surface: WLIDI.white,
  surfaceVariant: WLIDI.mint,
  error: '#E53935',
  success: WLIDI.teal,
  warning: WLIDI.starGold,
  onPrimary: WLIDI.white,
  onBackground: WLIDI.text,
  onSurface: WLIDI.text,
  onSurfaceVariant: WLIDI.textMuted,
  outline: WLIDI.outline,
};

export const COLORS_LIGHT: KiddyColors = {
  primary: WLIDI.teal,
  primaryContainer: WLIDI.mint,
  secondary: WLIDI.coral,
  secondaryContainer: WLIDI.peachLight,
  background: WLIDI.cream,
  surface: WLIDI.white,
  surfaceVariant: WLIDI.mint,
  error: '#E53935',
  success: WLIDI.teal,
  warning: WLIDI.starGold,
  onPrimary: WLIDI.white,
  onBackground: WLIDI.text,
  onSurface: WLIDI.text,
  onSurfaceVariant: WLIDI.textMuted,
  outline: WLIDI.outline,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 32,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const SHADOW = {
  sm: {
    shadowColor: '#263238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#263238',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
