import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import {
  addDays,
  daysBetween,
  isSameDate,
  isWeekend,
  relativeDayLabel,
  todayInKst,
  weekdayName,
  type CivilDate,
} from '../utils/date';
import { PressableScale } from './motion';

interface DayNavigatorProps {
  date: CivilDate;
  onChange: (date: CivilDate) => void;
  /** How far forwards and backwards the student may browse. */
  rangeDays?: number;
}

/** Chip width plus the gap, i.e. one step of the strip. */
const CHIP_WIDTH = 52;
const CHIP_GAP = space(2);
const STEP = CHIP_WIDTH + CHIP_GAP;

/**
 * The day switcher: a calendar strip the student swipes, the way every app
 * that books or serves something by the day does it.
 *
 * The previous version was two arrows and a pair of shortcuts, which meant
 * seven taps to reach next Tuesday and no sense of where in the week you were.
 * Here the whole fortnight is one scrollable row, the selected day is filled,
 * and today keeps a dot under it so it stays findable once you have scrolled
 * away from it.
 */
export function DayNavigator({ date, onChange, rangeDays = 14 }: DayNavigatorProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const scroller = useRef<ScrollView>(null);
  const viewport = useRef(0);

  const today = useMemo(() => todayInKst(), []);
  const days = useMemo(
    () => Array.from({ length: rangeDays * 2 + 1 }, (_, i) => addDays(today, i - rangeDays)),
    [today, rangeDays],
  );

  const selectedIndex = rangeDays + daysBetween(today, date);
  const isOnToday = isSameDate(date, today);

  /** Centres the selected chip, so the days either side of it stay visible. */
  const centre = useCallback(
    (index: number, animated: boolean) => {
      const width = viewport.current;
      if (width <= 0) return;
      const x = Math.max(0, index * STEP + CHIP_WIDTH / 2 - width / 2);
      scroller.current?.scrollTo({ x, animated });
    },
    [],
  );

  // Follows the date wherever it is set from — the strip itself, "오늘", or the
  // empty state's jump-back button on the screen below.
  useEffect(() => {
    centre(selectedIndex, true);
  }, [selectedIndex, centre]);

  const pick = (target: CivilDate) => {
    if (isSameDate(target, date)) return;
    void Haptics.selectionAsync();
    onChange(target);
  };

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[text.heading, styles.relative]}>{relativeDayLabel(date, today)}</Text>
          <Text style={[text.caption, styles.absolute]}>
            {date.year}년 {date.month}월 {date.day}일 {weekdayName(date)}요일
          </Text>
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ selected: isOnToday }}
          accessibilityLabel="오늘로 이동"
          onPress={() => pick(today)}
          disabled={isOnToday}
          scaleTo={0.92}
          dim
          style={[styles.todayButton, isOnToday ? styles.todayButtonOff : null]}
        >
          <Ionicons
            name="today-outline"
            size={13}
            color={isOnToday ? t.colors.textMuted : t.colors.brand}
          />
          <Text style={[text.label, isOnToday ? styles.todayLabelOff : styles.todayLabel]}>
            오늘
          </Text>
        </PressableScale>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        decelerationRate="fast"
        snapToInterval={STEP}
        onLayout={(event) => {
          viewport.current = event.nativeEvent.layout.width;
          // The first pass has no width yet, so the initial centring happens
          // here rather than in the effect above — and without an animation,
          // because the strip should already be in place when it appears.
          centre(selectedIndex, false);
        }}
      >
        {days.map((day, index) => {
          const selected = index === selectedIndex;
          const isNow = isSameDate(day, today);
          const weekend = isWeekend(day);

          return (
            <PressableScale
              key={`${day.year}-${day.month}-${day.day}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${day.month}월 ${day.day}일 ${weekdayName(day)}요일`}
              onPress={() => pick(day)}
              scaleTo={0.9}
              style={[styles.chip, selected ? styles.chipSelected : null]}
            >
              <Text
                style={[
                  styles.weekday,
                  selected ? styles.weekdaySelected : weekend ? styles.weekend : null,
                ]}
              >
                {weekdayName(day)}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  selected ? styles.dayNumberSelected : weekend ? styles.weekend : null,
                ]}
              >
                {day.day}
              </Text>
              <View
                style={[
                  styles.marker,
                  isNow
                    ? { backgroundColor: selected ? t.colors.surface : t.colors.brand }
                    : null,
                ]}
              />
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { gap: space(3) },

    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space(3),
      paddingHorizontal: space(1),
    },
    headText: { gap: space(0.5), flex: 1 },
    relative: { color: t.colors.text },
    absolute: { color: t.colors.textSecondary, fontVariant: ['tabular-nums'] },

    todayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1.5),
      paddingHorizontal: space(3),
      paddingVertical: space(2),
      borderRadius: radius.pill,
      backgroundColor: t.colors.brandSoft,
    },
    todayButtonOff: { backgroundColor: t.colors.surfaceMuted },
    todayLabel: { color: t.colors.brand },
    todayLabelOff: { color: t.colors.textMuted },

    strip: { gap: CHIP_GAP, paddingHorizontal: space(1), paddingVertical: space(0.5) },
    chip: {
      width: CHIP_WIDTH,
      paddingVertical: space(2.5),
      borderRadius: radius.lg,
      alignItems: 'center',
      gap: space(1),
      backgroundColor: t.colors.surfaceMuted,
    },
    chipSelected: { backgroundColor: t.colors.text },

    weekday: { fontSize: 11, lineHeight: 14, fontWeight: '700', color: t.colors.textSecondary },
    weekdaySelected: { color: t.colors.background },
    dayNumber: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '800',
      letterSpacing: -0.4,
      color: t.colors.text,
      fontVariant: ['tabular-nums'],
    },
    dayNumberSelected: { color: t.colors.background },
    weekend: { color: t.colors.textMuted },

    // Always laid out, only sometimes filled, so a chip never changes height.
    marker: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'transparent' },
  });
