import { Platform, TextStyle, ViewStyle } from 'react-native';

import type { CrowdLevel, MealType, RadarStatus } from '../types';

/**
 * A single warm, food-forward palette. Every colour used anywhere in the app
 * comes from here so screens stay visually consistent.
 */
export const colors = {
  /** App background — a soft warm grey so white cards read as elevated. */
  background: '#F6F5F3',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EFEC',
  surfaceSunken: '#EAE7E2',

  border: '#E4E0DA',
  borderStrong: '#D3CEC6',

  text: '#1C1917',
  textSecondary: '#6B635B',
  textMuted: '#9C948B',

  brand: '#E8552F',
  brandDark: '#C13F1E',
  brandSoft: '#FDEDE8',

  accent: '#0F766E',
  accentSoft: '#E1F2F0',

  success: '#15803D',
  successSoft: '#E4F5E9',
  warning: '#B45309',
  warningSoft: '#FDF1DF',
  danger: '#B91C1C',
  dangerSoft: '#FCE9E9',

  overlay: 'rgba(28, 25, 23, 0.45)',
  white: '#FFFFFF',
} as const;

/** 4pt spacing scale. `space(3)` === 12. */
export const space = (steps: number): number => steps * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export const type: Record<
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'mono',
  TextStyle
> = {
  display: { fontFamily, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.6 },
  title: { fontFamily, fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontFamily: fontFamilyMedium, fontSize: 18, lineHeight: 24, fontWeight: '600' },
  subheading: { fontFamily: fontFamilyMedium, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontFamily: fontFamilyMedium, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  label: { fontFamily: fontFamilyMedium, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontFamily, fontSize: 12, lineHeight: 16, fontWeight: '400' },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 2,
  },
};

/** Cross platform elevation presets. */
export const shadow: Record<'sm' | 'md' | 'lg', ViewStyle> = {
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1C1917',
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 1 },
    default: {},
  })!,
  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1C1917',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 3 },
    default: {},
  })!,
  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1C1917',
      shadowOpacity: 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
    },
    android: { elevation: 8 },
    default: {},
  })!,
};

export interface MealTheme {
  label: string;
  emoji: string;
  /** Two stop gradient for the card header. */
  gradient: readonly [string, string];
  tint: string;
  soft: string;
  /** Typical serving window, shown on the card. */
  window: string;
}

export const mealTheme: Record<MealType, MealTheme> = {
  breakfast: {
    label: '조식',
    emoji: '🌅',
    gradient: ['#F7B733', '#E8862F'],
    tint: '#B45309',
    soft: '#FDF1DF',
    window: '07:30 – 08:20',
  },
  lunch: {
    label: '중식',
    emoji: '🍚',
    gradient: ['#F2704A', '#D93F1F'],
    tint: '#C13F1E',
    soft: '#FDEDE8',
    window: '11:30 – 12:30',
  },
  dinner: {
    label: '석식',
    emoji: '🌙',
    gradient: ['#6366F1', '#4338CA'],
    tint: '#4338CA',
    soft: '#EAEAFB',
    window: '18:00 – 18:50',
  },
};

export interface CrowdStep {
  level: CrowdLevel;
  label: string;
  detail: string;
  color: string;
  soft: string;
}

/** The five point crowd scale, from empty to packed. */
export const crowdScale: CrowdStep[] = [
  { level: 1, label: '한산', detail: '바로 받을 수 있어요', color: '#15803D', soft: '#E4F5E9' },
  { level: 2, label: '여유', detail: '줄이 짧아요', color: '#4D8C1F', soft: '#EDF5E3' },
  { level: 3, label: '보통', detail: '평소만큼 기다려요', color: '#B45309', soft: '#FDF1DF' },
  { level: 4, label: '혼잡', detail: '줄이 길어요', color: '#D9541F', soft: '#FCEAE1' },
  { level: 5, label: '매우 혼잡', detail: '한참 기다려야 해요', color: '#B91C1C', soft: '#FCE9E9' },
];

export function crowdStepFor(level: number): CrowdStep {
  const index = Math.min(crowdScale.length, Math.max(1, Math.round(level))) - 1;
  return crowdScale[index];
}

export interface RadarStatusTheme {
  label: string;
  emoji: string;
  color: string;
  soft: string;
  /** Ring radius as a fraction of the radar's usable radius. */
  ring: number;
}

export const radarStatusTheme: Record<RadarStatus, RadarStatusTheme> = {
  seated: { label: '급식실 도착', emoji: '🍽️', color: '#E8552F', soft: '#FDEDE8', ring: 0.3 },
  heading: { label: '가는 중', emoji: '🏃', color: '#B45309', soft: '#FDF1DF', ring: 0.62 },
  idle: { label: '교실', emoji: '💤', color: '#6B635B', soft: '#F1EFEC', ring: 0.95 },
  done: { label: '식사 완료', emoji: '✅', color: '#0F766E', soft: '#E1F2F0', ring: 0.95 },
};

/** Order used when listing friends on the radar — closest to the food first. */
export const RADAR_STATUS_ORDER: RadarStatus[] = ['seated', 'heading', 'idle', 'done'];
