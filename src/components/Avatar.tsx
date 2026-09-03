import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme';

interface AvatarProps {
  emoji: string;
  size?: number;
  /** Ring colour used to signal live status on the radar. */
  ringColor?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  emoji,
  size = 44,
  ringColor,
  background = colors.surfaceMuted,
  style,
}: AvatarProps) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          borderWidth: ringColor ? 2 : 0,
          borderColor: ringColor ?? 'transparent',
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
