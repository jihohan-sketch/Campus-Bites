import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, space } from '../theme';
import type { StarValue } from '../types';

/** react-native-web has no native animation module; driving there warns. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const STARS: StarValue[] = [1, 2, 3, 4, 5];

interface StarRatingProps {
  /** Whole stars when interactive; may be fractional for display. */
  value: number;
  size?: number;
  /** Omit to render a read-only rating. */
  onChange?: (value: StarValue) => void;
  color?: string;
}

/**
 * Five stars that pop as they are filled, so picking a score feels like an
 * action rather than a form input.
 */
export function StarRating({
  value,
  size = 28,
  onChange,
  color = '#E8952F',
}: StarRatingProps) {
  const interactive = Boolean(onChange);

  return (
    <View
      accessibilityRole={interactive ? 'adjustable' : 'image'}
      accessibilityLabel={`5점 만점에 ${value.toFixed(1)}점`}
      style={styles.row}
    >
      {STARS.map((star) => (
        <Star
          key={star}
          star={star}
          value={value}
          size={size}
          color={color}
          onPress={onChange ? () => onChange(star) : undefined}
        />
      ))}
    </View>
  );
}

function Star({
  star,
  value,
  size,
  color,
  onPress,
}: {
  star: StarValue;
  value: number;
  size: number;
  color: string;
  onPress?: () => void;
}) {
  // A half-filled star reads as filled; the numeric average carries precision.
  const filled = value >= star - 0.5;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!filled) return;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.28,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [filled, scale]);

  const icon = (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons
        name={filled ? 'star' : 'star-outline'}
        size={size}
        color={filled ? color : colors.borderStrong}
      />
    </Animated.View>
  );

  if (!onPress) return icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${star}점`}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
  pressed: { opacity: 0.7 },
});
