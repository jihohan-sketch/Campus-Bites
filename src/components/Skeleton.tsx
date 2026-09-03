import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space } from '../theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** A single shimmering placeholder bar. */
export function Skeleton({ width = '100%', height = 14, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.bar,
        { width, height, borderRadius: height / 2, opacity: pulse },
        style,
      ]}
    />
  );
}

/** Placeholder shaped like a loaded meal card. */
export function MealCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="45%" height={18} />
      <View style={styles.lines}>
        <Skeleton width="88%" />
        <Skeleton width="72%" />
        <Skeleton width="80%" />
        <Skeleton width="60%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surfaceSunken },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space(4),
    gap: space(4),
  },
  lines: { gap: space(2.5) },
});
