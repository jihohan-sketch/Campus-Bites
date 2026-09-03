import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';
import {
  addDays,
  daysBetween,
  formatKoreanDate,
  isSameDate,
  relativeDayLabel,
  todayInKst,
  type CivilDate,
} from '../utils/date';

interface DayNavigatorProps {
  date: CivilDate;
  onChange: (date: CivilDate) => void;
  /** How far forwards and backwards the student may browse. */
  rangeDays?: number;
}

/**
 * Day switcher for the meal screen: Today / Tomorrow shortcuts for the common
 * case, plus arrows for browsing the rest of the week.
 */
export function DayNavigator({ date, onChange, rangeDays = 14 }: DayNavigatorProps) {
  const today = useMemo(() => todayInKst(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const offset = daysBetween(today, date);

  const canGoBack = offset > -rangeDays;
  const canGoForward = offset < rangeDays;

  const step = (amount: number) => {
    void Haptics.selectionAsync();
    onChange(addDays(date, amount));
  };

  const jumpTo = (target: CivilDate) => {
    if (isSameDate(target, date)) return;
    void Haptics.selectionAsync();
    onChange(target);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ArrowButton
          direction="back"
          disabled={!canGoBack}
          onPress={() => step(-1)}
          accessibilityLabel="이전 날짜"
        />

        <View style={styles.center}>
          <Text style={[type.heading, styles.relative]}>{relativeDayLabel(date, today)}</Text>
          <Text style={[type.caption, styles.absolute]}>{formatKoreanDate(date)}</Text>
        </View>

        <ArrowButton
          direction="forward"
          disabled={!canGoForward}
          onPress={() => step(1)}
          accessibilityLabel="다음 날짜"
        />
      </View>

      <View style={styles.shortcuts}>
        <Shortcut label="오늘" active={isSameDate(date, today)} onPress={() => jumpTo(today)} />
        <Shortcut label="내일" active={isSameDate(date, tomorrow)} onPress={() => jumpTo(tomorrow)} />
      </View>
    </View>
  );
}

function ArrowButton({
  direction,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  direction: 'back' | 'forward';
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.arrow,
        pressed ? styles.arrowPressed : null,
        disabled ? styles.arrowDisabled : null,
      ]}
    >
      <Ionicons
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={disabled ? colors.textMuted : colors.text}
      />
    </Pressable>
  );
}

function Shortcut({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.shortcut,
        active ? styles.shortcutActive : null,
        pressed && !active ? styles.shortcutPressed : null,
      ]}
    >
      <Text style={[type.label, active ? styles.shortcutLabelActive : styles.shortcutLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: space(3) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: space(0.5) },
  relative: { color: colors.text },
  absolute: { color: colors.textSecondary },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowPressed: { backgroundColor: colors.surfaceMuted },
  arrowDisabled: { opacity: 0.4 },
  shortcuts: { flexDirection: 'row', gap: space(2), justifyContent: 'center' },
  shortcut: {
    paddingHorizontal: space(4),
    paddingVertical: space(1.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutActive: { backgroundColor: colors.text, borderColor: colors.text },
  shortcutPressed: { backgroundColor: colors.surfaceMuted },
  shortcutLabel: { color: colors.textSecondary },
  shortcutLabelActive: { color: colors.white },
});
