import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import { useAnimatedTo } from './motion';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

const PADDING = space(1);

/**
 * iOS-style segmented switch. The selected pill slides between segments rather
 * than reappearing somewhere else, which is most of what makes it feel native.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const styles = useStyles(makeStyles);
  const [trackWidth, setTrackWidth] = useState(0);

  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const segmentWidth = trackWidth > 0 ? (trackWidth - PADDING * 2) / options.length : 0;
  const offset = useAnimatedTo(segmentWidth * index, 240, true);

  const onLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  return (
    <View style={[styles.track, style]} onLayout={onLayout}>
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            theme.shadow.xs,
            { width: segmentWidth, transform: [{ translateX: offset }] },
          ]}
        />
      ) : null}

      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
            style={styles.segment}
          >
            <Text
              numberOfLines={1}
              style={[text.label, selected ? styles.labelSelected : styles.label]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: t.colors.surfaceSunken,
      borderRadius: radius.md,
      padding: PADDING,
    },
    thumb: {
      position: 'absolute',
      top: PADDING,
      left: PADDING,
      bottom: PADDING,
      backgroundColor: t.colors.surface,
      borderRadius: radius.md - PADDING,
    },
    segment: {
      flex: 1,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { color: t.colors.textSecondary },
    labelSelected: { color: t.colors.text, fontWeight: '700' },
  });
