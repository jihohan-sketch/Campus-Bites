import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import {
  addDays,
  daysBetween,
  formatKoreanDate,
  isSameDate,
  relativeDayLabel,
  todayInKst,
  type CivilDate,
} from '../utils/date';
import { PressableScale } from './motion';

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
  const styles = useStyles(makeStyles);
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
          <Text style={[text.heading, styles.relative]}>{relativeDayLabel(date, today)}</Text>
          <Text style={[text.caption, styles.absolute]}>{formatKoreanDate(date)}</Text>
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
  const t = useTheme();
  const styles = useStyles(makeStyles);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      scaleTo={0.88}
      style={[styles.arrow, disabled ? styles.arrowDisabled : null]}
    >
      <Ionicons
        name={direction === 'back' ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={disabled ? t.colors.textMuted : t.colors.text}
      />
    </PressableScale>
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
  const styles = useStyles(makeStyles);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      scaleTo={0.94}
      dim
      style={[styles.shortcut, active ? styles.shortcutActive : null]}
    >
      <Text style={[text.label, active ? styles.shortcutLabelActive : styles.shortcutLabel]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { gap: space(3.5) },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    center: { alignItems: 'center', gap: space(0.5) },
    relative: { color: t.colors.text },
    absolute: { color: t.colors.textSecondary, fontVariant: ['tabular-nums'] },
    arrow: {
      width: 42,
      height: 42,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceMuted,
    },
    arrowDisabled: { opacity: 0.35 },
    shortcuts: { flexDirection: 'row', gap: space(2), justifyContent: 'center' },
    shortcut: {
      paddingHorizontal: space(5),
      paddingVertical: space(2),
      borderRadius: radius.pill,
      backgroundColor: t.colors.surfaceMuted,
    },
    shortcutActive: { backgroundColor: t.colors.text },
    shortcutLabel: { color: t.colors.textSecondary },
    shortcutLabelActive: { color: t.colors.background },
  });
