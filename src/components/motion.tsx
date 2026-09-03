import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { motion } from '../theme';

/** react-native-web has no native animation module; driving there warns. */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** Animating the Pressable itself keeps `flex` and `alignSelf` on the box that
 *  actually participates in the parent's layout. */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ------------------------------------------------------------ press feel */

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far the element sinks. Big surfaces need less. */
  scaleTo?: number;
  /** Dim as well as shrink — right for rows, wrong for filled buttons. */
  dim?: boolean;
}

/**
 * A press that springs. The dip is fast and the release is a spring, which is
 * what makes a tap feel physical instead of like a state change.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  dim = false,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animate = (pressed: boolean) => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressed ? scaleTo : 1,
        friction: 7,
        tension: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(opacity, {
        toValue: pressed && dim ? 0.72 : 1,
        duration: motion.instant,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        animate(true);
        rest.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(false);
        rest.onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }], opacity }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/* --------------------------------------------------------------- entrance */

interface FadeInProps {
  children: React.ReactNode;
  /** Position in a list; multiplies the stagger delay. */
  index?: number;
  /** Travel distance in px. Negative slides down from above. */
  offset?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Cards rise a few pixels as they fade in, staggered by `index` so a list
 * arrives as a wave rather than a flash.
 */
export function FadeIn({
  children,
  index = 0,
  offset = 14,
  duration = motion.slow,
  style,
}: FadeInProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: index * motion.stagger,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, index, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ pulse */

interface PulseProps {
  children: React.ReactNode;
  /** Set false to hold the element still without unmounting it. */
  active?: boolean;
  /** One full breath, in ms. Faster reads as more urgent. */
  duration?: number;
  /** Peak scale at the top of the breath. */
  scaleTo?: number;
  minOpacity?: number;
  style?: StyleProp<ViewStyle>;
}

/** A slow breath — used for LIVE dots and the "very busy" crowd reading. */
export function Pulse({
  children,
  active = true,
  duration = 1100,
  scaleTo = 1.35,
  minOpacity = 0.4,
  style,
}: PulseProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, active, duration]);

  return (
    <Animated.View
      style={[
        style,
        active
          ? {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, minOpacity] }),
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, scaleTo] }) },
              ],
            }
          : null,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------- misc */

/**
 * Animates a value towards `target` whenever it changes, and returns it. Used
 * for bars and meters that should grow into place rather than snap.
 */
export function useAnimatedTo(target: number, duration: number = motion.slow, native = false) {
  const value = useRef(new Animated.Value(target)).current;

  useEffect(() => {
    const animation = Animated.timing(value, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native && USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [value, target, duration, native]);

  return value;
}
