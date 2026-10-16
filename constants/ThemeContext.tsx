import React, { createContext, useContext } from 'react';
import { COLORS_LIGHT } from './theme';
import type { KiddyColors } from '../types';

const ThemeContext = createContext<KiddyColors>(COLORS_LIGHT);

/** WLIDI uses a fixed light Soft Play theme across the app. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={COLORS_LIGHT}>{children}</ThemeContext.Provider>;
}

export function useThemeColors(): KiddyColors {
  return useContext(ThemeContext);
}
