import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadow, space, type } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
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
  style?: StyleProp<ViewStyle>;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 36, md: 46, lg: 54 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leading,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const palette = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHTS[size], backgroundColor: palette.background },
        palette.border ? { borderWidth: 1, borderColor: palette.border } : null,
        variant === 'primary' && !isDisabled ? shadow.sm : null,
        fullWidth ? styles.fullWidth : null,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <View style={styles.content}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <Text
            numberOfLines={1}
            style={[
              type.bodyStrong,
              { color: palette.text },
              size === 'sm' ? styles.smallLabel : null,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<ButtonVariant, { background: string; text: string; border?: string }> = {
  primary: { background: colors.brand, text: colors.white },
  secondary: { background: colors.surface, text: colors.text, border: colors.borderStrong },
  ghost: { background: 'transparent', text: colors.brand },
  danger: { background: colors.dangerSoft, text: colors.danger },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(5),
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  leading: { marginRight: 0 },
  smallLabel: { fontSize: 13 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
