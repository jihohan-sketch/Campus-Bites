import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, space, type } from '../theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Inline validation or hint text shown under the field. */
  hint?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, containerStyle, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.brand : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[type.label, styles.label]}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[type.body, styles.input, { borderColor }]}
      />
      {error ? (
        <Text style={[type.caption, styles.error]}>{error}</Text>
      ) : hint ? (
        <Text style={[type.caption, styles.hint]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: space(1.5) },
  label: { color: colors.textSecondary },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space(3.5),
    backgroundColor: colors.surface,
    color: colors.text,
  },
  hint: { color: colors.textMuted },
  error: { color: colors.danger },
});
