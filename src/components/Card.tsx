import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow, space } from '../theme';

interface CardProps {
  children: React.ReactNode;
  /** `flat` drops the shadow for cards nested inside other surfaces. */
  variant?: 'raised' | 'flat';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, variant = 'raised', padded = true, style }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        padded ? styles.padded : null,
        variant === 'raised' ? shadow.sm : styles.flat,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  padded: { padding: space(4) },
  flat: { borderWidth: 1, borderColor: colors.border },
});
