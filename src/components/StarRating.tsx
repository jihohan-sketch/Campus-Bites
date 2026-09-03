import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';

import { space, useTheme } from '../theme';
import type { StarValue } from '../types';
import { USE_NATIVE_DRIVER } from './motion';

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
 * Five stars that pop as they are filled, left to right, so picking a score
 * feels like an action rather than a form input.
 */
export function StarRating({ value, size = 28, onChange, color }: StarRatingProps) {
  const theme = useTheme();
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
          color={color ?? theme.colors.star}
          emptyColor={theme.colors.track}
          onPress={
            onChange
              ? () => {
                  if (Platform.OS !== 'web') {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onChange(star);
                }
              : undefined
          }
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
  emptyColor,
  onPress,
}: {
  star: StarValue;
  value: number;
  size: number;
  color: string;
  emptyColor: string;
  onPress?: () => void;
}) {
  // A half-filled star reads as filled; the numeric average carries precision.
  const filled = value >= star - 0.5;
  const scale = useRef(new Animated.Value(1)).current;
  const settled = useRef(false);

  useEffect(() => {
    if (!filled) {
      settled.current = false;
      return;
    }
    // Each star lands slightly after the one to its left — the fill reads as a
    // sweep instead of five things happening at once.
    const animation = Animated.sequence([
      Animated.delay(settled.current ? 0 : star * 32),
      Animated.timing(scale, {
        toValue: 1.34,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start(() => {
      settled.current = true;
    });
    return () => animation.stop();
  }, [filled, scale, star]);

  const icon = (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons
        name={filled ? 'star' : 'star-outline'}
        size={size}
        color={filled ? color : emptyColor}
      />
    </Animated.View>
  );

  if (!onPress) return icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${star}점`}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
  pressed: { opacity: 0.6 },
});
