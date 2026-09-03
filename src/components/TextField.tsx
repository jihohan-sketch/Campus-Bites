import React, { forwardRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import { useAnimatedTo } from './motion';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Inline validation or hint text shown under the field. */
  hint?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, containerStyle, onFocus, onBlur, multiline, ...inputProps },
  ref,
) {
  const theme = useTheme();
  const styles = useStyles(makeStyles);
  const [focused, setFocused] = useState(false);

  // A focus ring that grows in rather than snapping on.
  const focusProgress = useAnimatedTo(focused ? 1 : 0, 160);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.brand
      : theme.colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[text.label, styles.label]}>{label}</Text>

      <View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.focusRing,
            {
              borderColor: error ? theme.colors.danger : theme.colors.brand,
              opacity: error ? 0.35 : focusProgress,
              transform: [
                { scale: focusProgress.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) },
              ],
            },
          ]}
        />
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textMuted}
          multiline={multiline}
          {...inputProps}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            text.body,
            styles.input,
            multiline ? styles.multiline : null,
            { borderColor },
          ]}
        />
      </View>

      {error ? (
        <Text style={[text.caption, styles.error]}>{error}</Text>
      ) : hint ? (
        <Text style={[text.caption, styles.hint]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { gap: space(1.5) },
    label: { color: t.colors.textSecondary },
    input: {
      minHeight: 50,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: space(4),
      paddingVertical: space(3),
      backgroundColor: t.colors.surface,
      color: t.colors.text,
    },
    multiline: { minHeight: 88, textAlignVertical: 'top' },
    /** Sits just outside the input, so focus reads as a halo not a thicker line. */
    focusRing: {
      position: 'absolute',
      top: -3,
      left: -3,
      right: -3,
      bottom: -3,
      borderRadius: radius.md + 3,
      borderWidth: 2,
    },
    hint: { color: t.colors.textMuted },
    error: { color: t.colors.danger },
  });
