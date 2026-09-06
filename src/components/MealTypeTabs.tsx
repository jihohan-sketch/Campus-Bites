import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import { MEAL_TYPES, type MealType } from '../types';
import { useAnimatedTo } from './motion';

interface MealTypeTabsProps {
  value: MealType;
  onChange: (value: MealType) => void;
  /** Services that have a published menu on the day being browsed. */
  available: Record<MealType, boolean>;
  /** The service happening right now, marked with a live dot. */
  current?: MealType | null;
}

/** Breathing room inside the track, and therefore the pill's inset. */
const PADDING = space(1.5);

/**
 * Breakfast · Lunch · Dinner.
 *
 * The whole day used to arrive as three stacked cards, which meant the student
 * scrolled past two services to reach the one they came for. This is the
 * switch instead: one service on screen at a time, and the tab itself carries
 * that service's colour — the selected pill is the meal's own gradient, so the
 * control, the card below it and the page wash are all the same temperature.
 *
 * A service with no menu that day stays selectable. Tapping it should say "이
 * 시간에는 급식이 없어요", not refuse the tap and leave the student guessing.
 */
export function MealTypeTabs({ value, onChange, available, current }: MealTypeTabsProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const [trackWidth, setTrackWidth] = useState(0);

  const index = Math.max(0, MEAL_TYPES.indexOf(value));
  const tabWidth = trackWidth > 0 ? (trackWidth - PADDING * 2) / MEAL_TYPES.length : 0;
  const offset = useAnimatedTo(tabWidth * index, 260, true);

  const selected = t.meal[value];

  return (
    <View
      style={styles.track}
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.pill, t.shadow.sm, { width: tabWidth, transform: [{ translateX: offset }] }]}
        >
          {/* The pill is the meal's gradient. It slides between tabs and swaps
              hue as it goes, which is why the switch reads as "the whole screen
              just became dinner" rather than as a checkbox moving. */}
          <LinearGradient
            colors={selected.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.pillFill]}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.pillFill]}
          />
        </Animated.View>
      ) : null}

      {MEAL_TYPES.map((mealType) => {
        const meal = t.meal[mealType];
        const isSelected = mealType === value;
        const isEmpty = !available[mealType];

        return (
          <Pressable
            key={mealType}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${meal.label} ${meal.korean}${isEmpty ? ' · 급식 없음' : ''}`}
            onPress={() => {
              if (isSelected) return;
              void Haptics.selectionAsync();
              onChange(mealType);
            }}
            style={styles.tab}
          >
            <View style={styles.emojiRow}>
              <Text style={[styles.emoji, isEmpty && !isSelected ? styles.emojiEmpty : null]}>
                {meal.emoji}
              </Text>
              {current === mealType ? (
                <View
                  style={[
                    styles.liveDot,
                    { backgroundColor: isSelected ? meal.ink : t.colors.brand },
                  ]}
                />
              ) : null}
            </View>

            <Text
              numberOfLines={1}
              style={[
                text.label,
                styles.label,
                isSelected ? { color: meal.ink } : isEmpty ? styles.labelEmpty : null,
              ]}
            >
              {meal.label}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.korean,
                isSelected ? { color: meal.inkMuted } : isEmpty ? styles.labelEmpty : null,
              ]}
            >
              {meal.korean}
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
      borderRadius: radius.lg + PADDING,
      padding: PADDING,
    },
    pill: {
      position: 'absolute',
      top: PADDING,
      left: PADDING,
      bottom: PADDING,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    pillFill: { borderRadius: radius.lg },

    tab: {
      flex: 1,
      paddingVertical: space(2.5),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    },
    emojiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(1) },
    emoji: { fontSize: 19, lineHeight: 23 },
    emojiEmpty: { opacity: 0.35 },
    liveDot: { width: 6, height: 6, borderRadius: 3, marginTop: 1 },

    label: { color: t.colors.textSecondary, letterSpacing: -0.1 },
    labelEmpty: { color: t.colors.textMuted, opacity: 0.6 },
    korean: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '600',
      color: t.colors.textMuted,
      letterSpacing: 0.1,
    },
  });
