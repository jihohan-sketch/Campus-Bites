import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
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
 *
 * On the web the dip is a CSS transition instead. A tap should never hand the
 * JS thread a per-frame animation while the student is mid-scroll — that is
 * what makes a page feel like it seizes up when you touch the middle of it.
 */
export function PressableScale(props: PressableScaleProps) {
  // Platform never changes at runtime, so this branch never reorders hooks.
  return Platform.OS === 'web' ? (
    <CssPressableScale {...props} />
  ) : (
    <SpringPressableScale {...props} />
  );
}

function SpringPressableScale({
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
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: pressed && dim ? 0.72 : 1,
        duration: motion.instant,
        useNativeDriver: true,
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

const pressTransition = StyleSheet.create({
  base: {
    transitionProperty: 'transform, opacity',
    transitionDuration: `${motion.fast}ms`,
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  } as unknown as ViewStyle,
  rest: { transform: [{ scale: 1 }], opacity: 1 },
});

function CssPressableScale({
  children,
  style,
  scaleTo = 0.97,
  dim = false,
  disabled,
  ...rest
}: PressableScaleProps) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressTransition.base,
        pressed && !disabled
          ? { transform: [{ scale: scaleTo }], opacity: dim ? 0.72 : 1 }
          : pressTransition.rest,
      ]}
    >
      {children}
    </Pressable>
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

/**
 * A slow breath — used for LIVE dots and the "very busy" crowd reading.
 *
 * A pulse runs for as long as the screen is open, so it must never cost the JS
 * thread anything: the page has to stay scrollable and tappable underneath it.
 * Native drives the loop off-thread; the web build hands it to CSS, because
 * `Animated` there has no native driver and would otherwise run a
 * requestAnimationFrame loop through JS for the life of the screen — which is
 * exactly what makes a list stutter while it scrolls.
 */
export function Pulse(props: PulseProps) {
  // Platform never changes at runtime, so this branch never reorders hooks.
  return Platform.OS === 'web' ? <CssPulse {...props} /> : <AnimatedPulse {...props} />;
}

function AnimatedPulse({
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
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
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

/**
 * `animationKeyframes` is a react-native-web style extension, and it only
 * compiles through `StyleSheet.create` — an inline style silently drops it. A
 * pulse only ever takes a handful of shapes, so the sheets are built on first
 * use and reused from there.
 */
const cssPulseCache = new Map<string, StyleProp<ViewStyle>>();

function cssPulseStyle(duration: number, scaleTo: number, minOpacity: number): StyleProp<ViewStyle> {
  const key = `${duration}|${scaleTo}|${minOpacity}`;
  const cached = cssPulseCache.get(key);
  if (cached) return cached;

  const sheet = StyleSheet.create({
    pulse: {
      animationKeyframes: {
        '0%': { opacity: 1, transform: [{ scale: 1 }] },
        '50%': { opacity: minOpacity, transform: [{ scale: scaleTo }] },
        '100%': { opacity: 1, transform: [{ scale: 1 }] },
      },
      // One breath in and back out, so it matches the native timing.
      animationDuration: `${duration * 2}ms`,
      animationIterationCount: 'infinite',
      animationTimingFunction: 'ease-in-out',
    } as unknown as ViewStyle,
  });

  cssPulseCache.set(key, sheet.pulse);
  return sheet.pulse;
}

function CssPulse({
  children,
  active = true,
  duration = 1100,
  scaleTo = 1.35,
  minOpacity = 0.4,
  style,
}: PulseProps) {
  const animation = useMemo(
    () => cssPulseStyle(duration, scaleTo, minOpacity),
    [duration, scaleTo, minOpacity],
  );

  return <View style={[style, active ? animation : null]}>{children}</View>;
}

/* ------------------------------------------------------------------- misc */

/**
 * Animates a value towards `target` whenever it changes, and returns it. Used
 * for bars and meters that should grow into place rather than snap.
 *
 * The animation only runs when `target` moves, so a meter that refreshes every
 * few seconds is idle in between rather than looping.
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

/**
 * A short fade played whenever `key` changes — the way a live readout admits
 * that the number under it just moved. Opacity only, native driven, and it
 * settles at 1, so it can never leave anything dimmed or swallow a tap.
 */
export function useChangeFade(key: unknown, duration: number = motion.base) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    opacity.setValue(0.25);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, key, duration]);

  return opacity;
}
