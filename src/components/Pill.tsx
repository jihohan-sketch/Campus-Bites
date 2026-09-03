import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space, type } from '../theme';

interface PillProps {
  label: string;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
  /** Rendered before the label, e.g. an emoji or a coloured dot. */
  leading?: React.ReactNode;
}

/** Small rounded label used for allergens, statuses and counts. */
export function Pill({ label, color = colors.textSecondary, background = colors.surfaceMuted, style, leading }: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: background }, style]}>
      {leading}
      <Text style={[type.caption, styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1),
    borderRadius: radius.pill,
    paddingHorizontal: space(2.5),
    paddingVertical: space(1),
  },
  label: { fontWeight: '600' },
});
