import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';

interface PillProps {
  label: string;
  color?: string;
  background?: string;
  /** `solid` fills with `color` and flips the label to white. */
  variant?: 'soft' | 'solid' | 'outline';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  /** Rendered before the label, e.g. an emoji or a coloured dot. */
  leading?: React.ReactNode;
}

/** Small rounded label used for allergens, statuses and counts. */
export function Pill({
  label,
  color,
  background,
  variant = 'soft',
  style,
  labelStyle,
  leading,
}: PillProps) {
  const theme = useTheme();
  const styles = useStyles(makeStyles);

  const accent = color ?? theme.colors.textSecondary;
  const fill =
    variant === 'solid' ? accent : variant === 'outline' ? 'transparent' : background ?? theme.colors.surfaceMuted;
  const labelColor = variant === 'solid' ? theme.colors.onAccent : accent;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: fill },
        variant === 'outline'
          ? { borderWidth: StyleSheet.hairlineWidth, borderColor: accent }
          : null,
        style,
      ]}
    >
      {leading}
      <Text style={[text.caption, styles.label, { color: labelColor }, labelStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (_t: Theme) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1),
      borderRadius: radius.pill,
      paddingHorizontal: space(2.5),
      paddingVertical: space(1),
    },
    label: { fontWeight: '700', letterSpacing: -0.1 },
  });
