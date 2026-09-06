import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import { PressableScale } from './motion';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tonal';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Rendered to the left of the label — usually an icon. */
  leading?: React.ReactNode;
  fullWidth?: boolean;
  /** Overrides the accent for `primary` / `tonal` — e.g. the meal's tint. */
  tint?: string;
  style?: StyleProp<ViewStyle>;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 38, md: 50, lg: 56 };
/** Corners scale with the button, so nothing reads as a boxy web form field. */
const CORNERS: Record<ButtonSize, number> = { sm: radius.sm, md: radius.lg, lg: radius.xl };
const LABEL: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 16 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leading,
  fullWidth = false,
  tint,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useStyles(makeStyles);
  const isDisabled = disabled || loading;
  const accent = tint ?? theme.colors.brand;

  const palette: Record<ButtonVariant, { background: string; text: string; border?: string }> = {
    primary: { background: accent, text: theme.colors.onAccent },
    tonal: { background: theme.colors.brandSoft, text: accent },
    secondary: {
      background: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.borderStrong,
    },
    ghost: { background: 'transparent', text: accent },
    danger: { background: theme.colors.dangerSoft, text: theme.colors.danger },
  };

  const look = palette[variant];
  const isFilled = variant === 'primary';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      scaleTo={size === 'lg' ? 0.975 : 0.95}
      dim={!isFilled}
      style={[
        styles.base,
        { height: HEIGHTS[size], borderRadius: CORNERS[size], backgroundColor: look.background },
        look.border ? { borderWidth: StyleSheet.hairlineWidth, borderColor: look.border } : null,
        isFilled && !isDisabled ? theme.shadow.sm : null,
        fullWidth ? styles.fullWidth : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {/* A single soft highlight along the top edge — enough to give a filled
          button a lit surface without turning it into a gradient blob. */}
      {isFilled ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}

      {loading ? (
        <ActivityIndicator color={look.text} size="small" style={styles.above} />
      ) : (
        <View style={styles.content}>
          {leading}
          <Text numberOfLines={1} style={[text.bodyStrong, LABEL[size], { color: look.text }]}>
            {label}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const makeStyles = (_t: Theme) =>
  StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space(5),
      overflow: 'hidden',
    },
    fullWidth: { alignSelf: 'stretch' },
    content: { flexDirection: 'row', alignItems: 'center', gap: space(2), zIndex: 1 },
    above: { zIndex: 1 },
    disabled: { opacity: 0.4 },
  });
