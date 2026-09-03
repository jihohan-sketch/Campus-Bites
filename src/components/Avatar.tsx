import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

interface AvatarProps {
  emoji: string;
  size?: number;
  /** Ring colour used to signal a status, e.g. a crowd reading. */
  ringColor?: string;
  background?: string;
  /** Adds a soft halo in the ring colour — for the "this one is live" avatar. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  emoji,
  size = 44,
  ringColor,
  background,
  glow = false,
  style,
}: AvatarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background ?? theme.colors.surfaceMuted,
          borderWidth: ringColor ? 2 : StyleSheet.hairlineWidth,
          borderColor: ringColor ?? theme.colors.border,
        },
        glow && ringColor
          ? {
              shadowColor: ringColor,
              shadowOpacity: 0.55,
              shadowRadius: size * 0.3,
              shadowOffset: { width: 0, height: 0 },
            }
          : null,
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
