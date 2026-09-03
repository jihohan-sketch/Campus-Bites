import { Platform, TextStyle, ViewStyle } from 'react-native';

import type { CrowdLevel, MealTag, MealType } from '../types';
import type { RushLevel } from '../config/lunchRush';

/**
 * Design tokens.
 *
 * React Native has no CSS custom properties, so this module is the equivalent:
 * one place that owns every colour, space, radius, type ramp and elevation in
 * the app. Anything visual is a token lookup — nothing hard-codes a hex value.
 *
 * Tokens that depend on light / dark are indexed by `Scheme`; the rest (space,
 * radius, type) are shared, because a heading is 22pt in both themes.
 */

export type Scheme = 'light' | 'dark';

/* ------------------------------------------------------------------ scale */

/** 4pt spacing scale. `space(3)` === 12. */
export const space = (steps: number): number => steps * 4;

/** Roomy, iOS-flavoured corners. Cards use `xl`, sheets use `xxl`. */
export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
  pill: 999,
} as const;

/* --------------------------------------------------------------- palettes */

export interface Palette {
  /** Page background, behind every card. */
  background: string;
  /** A second background stop — the app paints a soft vertical wash. */
  backgroundAlt: string;
  /** Faint colour bloom behind the header, per meal accent. */
  bloomOpacity: number;

  surface: string;
  /** One step above `surface`, for cards nested inside cards. */
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceSunken: string;

  /** Translucent fill for the frosted panels. */
  glass: string;
  /** The bright hairline that sells a glass edge. */
  glassBorder: string;
  /** Top-to-bottom sheen laid over glass surfaces. */
  glassSheen: readonly [string, string];

  border: string;
  borderStrong: string;
  /** Hairline used inside cards to separate rows. */
  divider: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  /** Text that sits on a saturated (gradient) background. */
  onAccent: string;

  brand: string;
  brandStrong: string;
  brandSoft: string;

  accent: string;
  accentSoft: string;

  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;

  /** Star fill — a single warm gold in both themes. */
  star: string;
  /** Unfilled star / empty track. */
  track: string;

  overlay: string;
  white: string;
  /** Shadow colour; a much heavier black in dark mode reads as depth. */
  shadowColor: string;
  shadowOpacity: { sm: number; md: number; lg: number };
}

const light: Palette = {
  background: '#F4F4F7',
  backgroundAlt: '#FBFBFD',
  bloomOpacity: 0.5,

  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1F1F5',
  surfaceSunken: '#E7E7EE',

  glass: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  glassSheen: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'],

  border: 'rgba(17, 17, 24, 0.07)',
  borderStrong: 'rgba(17, 17, 24, 0.16)',
  divider: 'rgba(17, 17, 24, 0.06)',

  text: '#111118',
  textSecondary: '#5A5A68',
  textMuted: '#8E8E9C',
  onAccent: '#FFFFFF',

  brand: '#F2662E',
  brandStrong: '#D34C18',
  brandSoft: '#FFEFE7',

  accent: '#0E8F84',
  accentSoft: '#E0F3F1',

  success: '#12925A',
  successSoft: '#E3F5EB',
  warning: '#B4740A',
  warningSoft: '#FDF2DE',
  danger: '#D63A3A',
  dangerSoft: '#FDEAEA',

  star: '#F5A524',
  track: 'rgba(17, 17, 24, 0.10)',

  overlay: 'rgba(12, 12, 18, 0.42)',
  white: '#FFFFFF',
  shadowColor: '#0D0D18',
  shadowOpacity: { sm: 0.05, md: 0.09, lg: 0.16 },
};

const dark: Palette = {
  background: '#0A0A0E',
  backgroundAlt: '#121218',
  bloomOpacity: 0.34,

  surface: '#16161D',
  surfaceElevated: '#1D1D26',
  surfaceMuted: '#20202A',
  surfaceSunken: '#282833',

  glass: 'rgba(32, 32, 42, 0.68)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassSheen: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'],

  border: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  divider: 'rgba(255, 255, 255, 0.07)',

  text: '#F4F4F7',
  textSecondary: '#A2A2B2',
  textMuted: '#72727F',
  onAccent: '#FFFFFF',

  brand: '#FF8A5C',
  brandStrong: '#FF9F78',
  brandSoft: 'rgba(255, 138, 92, 0.16)',

  accent: '#2DD4BF',
  accentSoft: 'rgba(45, 212, 191, 0.15)',

  success: '#34D07F',
  successSoft: 'rgba(52, 208, 127, 0.15)',
  warning: '#F0B429',
  warningSoft: 'rgba(240, 180, 41, 0.15)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.16)',

  star: '#FFC24A',
  track: 'rgba(255, 255, 255, 0.12)',

  overlay: 'rgba(0, 0, 0, 0.62)',
  white: '#FFFFFF',
  shadowColor: '#000000',
  shadowOpacity: { sm: 0.3, md: 0.45, lg: 0.6 },
};

export const palettes: Record<Scheme, Palette> = { light, dark };

/* ----------------------------------------------------------------- shadow */

export type ShadowStep = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Soft, wide, low-opacity shadows — the difference between "card" and
 * "cheap card" is almost entirely the blur radius.
 */
export function buildShadows(palette: Palette): Record<ShadowStep, ViewStyle> {
  const ios = (opacity: number, blur: number, y: number): ViewStyle => ({
    shadowColor: palette.shadowColor,
    shadowOpacity: opacity,
    shadowRadius: blur,
    shadowOffset: { width: 0, height: y },
  });

  const web = (opacity: number, blur: number, y: number): ViewStyle =>
    ({
      boxShadow: `0 ${y}px ${blur}px rgba(0,0,0,${opacity})`,
    }) as unknown as ViewStyle;

  const step = (opacity: number, blur: number, y: number, elevation: number) =>
    Platform.select<ViewStyle>({
      ios: ios(opacity, blur, y),
      android: { elevation, shadowColor: palette.shadowColor },
      default: web(opacity, blur, y),
    })!;

  const o = palette.shadowOpacity;
  return {
    xs: step(o.sm * 0.8, 6, 1, 1),
    sm: step(o.sm, 14, 4, 2),
    md: step(o.md, 26, 10, 6),
    lg: step(o.lg, 44, 20, 14),
  };
}

/* ------------------------------------------------------------- typography */

const sans = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
});

const sansMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
});

export type TypeToken =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'overline'
  | 'numeric'
  | 'mono';

/**
 * A deliberately gappy ramp. Adjacent steps differ by enough that hierarchy is
 * obvious at a glance — 34 / 28 / 22 / 18 / 16 / 15 / 13 / 12 / 11.
 */
export const type: Record<TypeToken, TextStyle> = {
  hero: { fontFamily: sans, fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -1 },
  display: { fontFamily: sans, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7 },
  title: { fontFamily: sans, fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontFamily: sansMedium, fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3 },
  subheading: { fontFamily: sansMedium, fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontFamily: sans, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontFamily: sansMedium, fontSize: 15, lineHeight: 22, fontWeight: '600', letterSpacing: -0.1 },
  label: { fontFamily: sansMedium, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontFamily: sans, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  /** Small, wide, loud — section eyebrows and LIVE badges. */
  overline: { fontFamily: sansMedium, fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 1 },
  /** Tabular-feeling figures for scores and counters. */
  numeric: {
    fontFamily: sans,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.6,
    fontVariant: ['tabular-nums'],
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' }),
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 3,
  },
};

/* ------------------------------------------------------------ meal themes */

export interface MealTheme {
  label: string;
  /** Shown on the card header. */
  emoji: string;
  /** Header gradient — two stops, same hue family, never a rainbow. */
  gradient: readonly [string, string];
  /** Readable accent on `surface`, used for text and bullets. */
  tint: string;
  /** Tinted fill for chips and the header bloom. */
  soft: string;
  /**
   * Text laid over `gradient`. Breakfast's warm yellow is too light to carry
   * white type, so it inks dark while the other two stay white.
   */
  ink: string;
  inkMuted: string;
  /** Translucent chip fill and hairline used on top of `gradient`. */
  inkWash: string;
  inkWashBorder: string;
  /** Typical serving window, shown on the card. */
  window: string;
}

const WHITE_INK = {
  ink: '#FFFFFF',
  inkMuted: 'rgba(255,255,255,0.88)',
  inkWash: 'rgba(255,255,255,0.22)',
  inkWashBorder: 'rgba(255,255,255,0.42)',
} as const;

/**
 * 조식 warm yellow · 중식 orange · 석식 indigo-violet, so a student can tell
 * which service they are looking at from across the room.
 */
export const mealThemes: Record<Scheme, Record<MealType, MealTheme>> = {
  light: {
    breakfast: {
      label: '조식',
      emoji: '🌅',
      gradient: ['#FFC960', '#F0942A'],
      tint: '#B4740A',
      soft: '#FFF3DE',
      ink: '#4A2E05',
      inkMuted: 'rgba(74,46,5,0.74)',
      inkWash: 'rgba(255,255,255,0.4)',
      inkWashBorder: 'rgba(255,255,255,0.7)',
      window: '07:30 – 08:20',
    },
    lunch: {
      label: '중식',
      emoji: '🍚',
      gradient: ['#FB7A45', '#E8451F'],
      tint: '#D3491D',
      soft: '#FFECE3',
      ...WHITE_INK,
      window: '11:30 – 12:30',
    },
    dinner: {
      label: '석식',
      emoji: '🌙',
      gradient: ['#7A69EE', '#4A38BF'],
      tint: '#5340C9',
      soft: '#EFECFE',
      ...WHITE_INK,
      window: '18:00 – 18:50',
    },
  },
  dark: {
    breakfast: {
      label: '조식',
      emoji: '🌅',
      gradient: ['#E0A93C', '#BC7C24'],
      tint: '#FFC960',
      soft: 'rgba(255, 201, 96, 0.14)',
      ink: '#2E1D03',
      inkMuted: 'rgba(46,29,3,0.76)',
      inkWash: 'rgba(255,255,255,0.28)',
      inkWashBorder: 'rgba(255,255,255,0.5)',
      window: '07:30 – 08:20',
    },
    lunch: {
      label: '중식',
      emoji: '🍚',
      gradient: ['#E8703F', '#C13C1B'],
      tint: '#FF9159',
      soft: 'rgba(255, 145, 89, 0.15)',
      ...WHITE_INK,
      window: '11:30 – 12:30',
    },
    dinner: {
      label: '석식',
      emoji: '🌙',
      gradient: ['#7565E0', '#4536AB'],
      tint: '#A99BFF',
      soft: 'rgba(169, 155, 255, 0.16)',
      ...WHITE_INK,
      window: '18:00 – 18:50',
    },
  },
};

/* ----------------------------------------------------------- crowd themes */

export interface CrowdStep {
  level: CrowdLevel;
  label: string;
  detail: string;
  color: string;
  soft: string;
}

/** The five point crowd scale, green (empty) to red (packed). */
export const crowdScales: Record<Scheme, CrowdStep[]> = {
  light: [
    { level: 1, label: '한산', detail: '바로 받을 수 있어요', color: '#12925A', soft: '#E3F5EB' },
    { level: 2, label: '여유', detail: '줄이 짧아요', color: '#5D9E1E', soft: '#EDF6E1' },
    { level: 3, label: '보통', detail: '평소만큼 기다려요', color: '#C98A06', soft: '#FDF3DD' },
    { level: 4, label: '혼잡', detail: '줄이 길어요', color: '#E8702E', soft: '#FEEDE2' },
    { level: 5, label: '매우 혼잡', detail: '한참 기다려야 해요', color: '#D63A3A', soft: '#FDEAEA' },
  ],
  dark: [
    { level: 1, label: '한산', detail: '바로 받을 수 있어요', color: '#34D07F', soft: 'rgba(52,208,127,0.15)' },
    { level: 2, label: '여유', detail: '줄이 짧아요', color: '#8CD44A', soft: 'rgba(140,212,74,0.15)' },
    { level: 3, label: '보통', detail: '평소만큼 기다려요', color: '#F0B429', soft: 'rgba(240,180,41,0.15)' },
    { level: 4, label: '혼잡', detail: '줄이 길어요', color: '#FF9457', soft: 'rgba(255,148,87,0.16)' },
    { level: 5, label: '매우 혼잡', detail: '한참 기다려야 해요', color: '#FF6B6B', soft: 'rgba(255,107,107,0.17)' },
  ],
};

/* ------------------------------------------------------ lunch rush themes */

export interface RushTheme {
  color: string;
  soft: string;
  /** Bar fill opacity — heavier traffic reads as a denser block. */
  intensity: number;
  /** Only the peak band pulses; a whole pulsing bar is noise. */
  pulse: boolean;
}

export const rushThemes: Record<Scheme, Record<RushLevel, RushTheme>> = {
  light: {
    peak: { color: '#D63A3A', soft: '#FDEAEA', intensity: 1, pulse: true },
    busy: { color: '#C98A06', soft: '#FDF3DD', intensity: 0.8, pulse: false },
    calm: { color: '#12925A', soft: '#E3F5EB', intensity: 0.62, pulse: false },
  },
  dark: {
    peak: { color: '#FF6B6B', soft: 'rgba(255,107,107,0.17)', intensity: 1, pulse: true },
    busy: { color: '#F0B429', soft: 'rgba(240,180,41,0.15)', intensity: 0.8, pulse: false },
    calm: { color: '#34D07F', soft: 'rgba(52,208,127,0.15)', intensity: 0.62, pulse: false },
  },
};

/* ------------------------------------------------------- rating tag theme */

export interface MealTagTheme {
  label: string;
  emoji: string;
  color: string;
  soft: string;
}

export const tagThemes: Record<Scheme, Record<MealTag, MealTagTheme>> = {
  light: {
    good: { label: '맛있어요', emoji: '🔥', color: '#D34C18', soft: '#FFEFE7' },
    ok: { label: '보통이에요', emoji: '😐', color: '#B4740A', soft: '#FDF2DE' },
    bad: { label: '별로예요', emoji: '👎', color: '#5A5A68', soft: '#F1F1F5' },
  },
  dark: {
    good: { label: '맛있어요', emoji: '🔥', color: '#FF9F78', soft: 'rgba(255,138,92,0.16)' },
    ok: { label: '보통이에요', emoji: '😐', color: '#F0B429', soft: 'rgba(240,180,41,0.15)' },
    bad: { label: '별로예요', emoji: '👎', color: '#A2A2B2', soft: 'rgba(255,255,255,0.07)' },
  },
};

/* ---------------------------------------------------------------- motion */

/** Shared timings, so nothing in the app animates at a random speed. */
export const motion = {
  instant: 120,
  fast: 180,
  base: 260,
  slow: 420,
  /** Delay between siblings in a staggered entrance. */
  stagger: 55,
} as const;
