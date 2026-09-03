import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, useStyles, useTheme, type Theme } from '../theme';

export type CardVariant = 'raised' | 'flat' | 'glass';

interface CardProps {
  children: React.ReactNode;
  /**
   * `raised` — the default white card.
   * `flat` — outlined, for cards nested inside another surface.
   * `glass` — frosted panel; used for anything that floats over colour.
   */
  variant?: CardVariant;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, variant = 'raised', padded = true, style }: CardProps) {
  const theme = useTheme();
  const styles = useStyles(makeStyles);

  if (variant === 'glass') {
    return (
      <View style={[styles.base, styles.glass, theme.shadow.sm, padded && styles.padded, style]}>
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        variant === 'raised' ? [styles.raised, theme.shadow.sm] : styles.flat,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * The blur behind a glass surface. Only the web build can actually blur what
 * is behind it; native falls back to the translucent fill, which still reads
 * as frosted against the page wash.
 */
export const backdropBlur = Platform.select<ViewStyle>({
  web: { backdropFilter: 'saturate(180%) blur(24px)' } as unknown as ViewStyle,
  default: {},
})!;

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.xl,
      overflow: 'hidden',
    },
    padded: { padding: space(4.5) },
    raised: {
      backgroundColor: t.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    flat: {
      backgroundColor: t.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.borderStrong,
    },
    glass: {
      backgroundColor: t.colors.glass,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.glassBorder,
      ...backdropBlur,
    },
  });
