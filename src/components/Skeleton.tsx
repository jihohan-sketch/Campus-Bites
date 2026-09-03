import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, space, useStyles, useTheme, type Theme } from '../theme';
import { USE_NATIVE_DRIVER } from './motion';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  /** Defaults to a pill; pass a value for block placeholders. */
  round?: number;
  style?: StyleProp<ViewStyle>;
}

/** One placeholder bar with a highlight sweeping across it. */
export function Skeleton({ width = '100%', height = 14, round, style }: SkeletonProps) {
  const theme = useTheme();
  const styles = useStyles(makeStyles);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        // A beat of stillness between passes, so it shimmers rather than strobes.
        Animated.delay(280),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [sweep]);

  return (
    <View
      style={[styles.bar, { width, height, borderRadius: round ?? height / 2 }, style]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                translateX: sweep.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-260, 260],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', theme.colors.surface, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, styles.sheen]}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Placeholder shaped like a loaded meal card, header band and all — the point
 * of a skeleton is that the real content lands where the grey was.
 */
export function MealCardSkeleton({ index = 0 }: { index?: number }) {
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} round={14} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={72} height={16} />
          <Skeleton width={96} height={11} />
        </View>
        <Skeleton width={58} height={22} />
      </View>

      <View style={styles.lines}>
        {[92, 74, 84, 62].map((width, line) => (
          <View key={width} style={styles.line}>
            <Skeleton width={22} height={22} round={8} />
            <Skeleton width={`${width - index * 2 - line}%`} height={13} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Placeholder for a row of avatar + two lines of text. */
export function RowSkeleton() {
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} round={20} />
      <View style={styles.rowText}>
        <Skeleton width="46%" height={14} />
        <Skeleton width="72%" height={11} />
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    bar: {
      backgroundColor: t.colors.surfaceSunken,
      overflow: 'hidden',
    },
    sheen: { opacity: t.isDark ? 0.18 : 0.75 },
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: space(4.5),
      gap: space(5),
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    cardHeaderText: { flex: 1, gap: space(2) },
    lines: { gap: space(3) },
    line: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    row: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(2) },
    rowText: { flex: 1, gap: space(2) },
  });
