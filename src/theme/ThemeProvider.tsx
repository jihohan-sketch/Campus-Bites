import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, type ViewStyle } from 'react-native';

import type { MealTag, MealType } from '../types';
import type { RushLevel } from '../config/lunchRush';
import {
  buildShadows,
  crowdScales,
  mealThemes,
  palettes,
  rushThemes,
  tagThemes,
  type CrowdStep,
  type MealTagTheme,
  type MealTheme,
  type Palette,
  type RushTheme,
  type Scheme,
  type ShadowStep,
} from './tokens';

/**
 * The resolved token set for the active colour scheme. Components read
 * everything visual off this object — it is the app's `:root` variables.
 */
export interface Theme {
  scheme: Scheme;
  isDark: boolean;
  colors: Palette;
  shadow: Record<ShadowStep, ViewStyle>;
  meal: Record<MealType, MealTheme>;
  crowd: CrowdStep[];
  rush: Record<RushLevel, RushTheme>;
  tag: Record<MealTag, MealTagTheme>;
  /** The crowd step for a 1–5 reading, clamped and rounded. */
  crowdStep: (level: number) => CrowdStep;
}

function buildTheme(scheme: Scheme): Theme {
  const colors = palettes[scheme];
  const crowd = crowdScales[scheme];

  return {
    scheme,
    isDark: scheme === 'dark',
    colors,
    shadow: buildShadows(colors),
    meal: mealThemes[scheme],
    crowd,
    rush: rushThemes[scheme],
    tag: tagThemes[scheme],
    crowdStep: (level: number) =>
      crowd[Math.min(crowd.length, Math.max(1, Math.round(level))) - 1],
  };
}

const THEMES: Record<Scheme, Theme> = {
  light: buildTheme('light'),
  dark: buildTheme('dark'),
};

const ThemeContext = createContext<Theme>(THEMES.light);

/** Follows the OS setting; nothing in the app overrides it. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = THEMES[scheme === 'dark' ? 'dark' : 'light'];

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * `StyleSheet.create` cannot see the theme, so styles are written as a factory
 * and cached per (factory, scheme). Each sheet is therefore still built once,
 * not on every render.
 *
 *     const styles = useStyles(makeStyles);
 *     const makeStyles = (t: Theme) => StyleSheet.create({ ... });
 */
const sheetCache = new WeakMap<object, Partial<Record<Scheme, unknown>>>();

export function useStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();

  return useMemo(() => {
    let byScheme = sheetCache.get(factory);
    if (!byScheme) {
      byScheme = {};
      sheetCache.set(factory, byScheme);
    }
    if (!byScheme[theme.scheme]) {
      byScheme[theme.scheme] = factory(theme);
    }
    return byScheme[theme.scheme] as T;
  }, [factory, theme]);
}
