import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StarRating } from './StarRating';
import { fetchMealsInRange } from '../config/school';
import { fetchSummaries } from '../services/ratings';
import { colors, radius, shadow, space, type as text } from '../theme';
import type { MealRatingSummary, MealType } from '../types';
import { addDays, fromYmd, toYmd, weekdayName, type CivilDate } from '../utils/date';

interface PastMealRatingsProps {
  schoolKey: string;
  /** Today, as the anchor the history counts back from. */
  today: CivilDate;
  mealType: MealType;
  /** How many previous days to compare. */
  days?: number;
}

interface HistoryRow {
  date: string;
  label: string;
  headline: string;
  summary: MealRatingSummary;
}

/** `20260902` → `9/2 (수)`. */
function labelOf(ymd: string): string {
  const date = fromYmd(ymd);
  if (!date) return ymd;
  return `${date.month}/${date.day} (${weekdayName(date)})`;
}

/**
 * Past days ranked by score, so students can see which menus actually landed
 * rather than relying on memory.
 */
export function PastMealRatings({
  schoolKey,
  today,
  mealType,
  days = 7,
}: PastMealRatingsProps) {
  const ymds = useMemo(
    () =>
      Array.from({ length: days }, (_, index) => toYmd(addDays(today, -(index + 1)))),
    [today, days],
  );

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    setLoading(true);

    const load = async () => {
      let summaries: Map<string, MealRatingSummary>;
      try {
        summaries = await fetchSummaries(schoolKey, ymds, mealType);
      } catch {
        // History is a nice-to-have; a failure here must not break the page.
        summaries = new Map();
      }
      if (disposed) return;

      const sorted = [...ymds].sort();
      const meals = fetchMealsInRange(sorted[0], sorted[sorted.length - 1]).filter(
        (meal) => meal.type === mealType,
      );

      const next = ymds
        .map<HistoryRow>((ymd) => {
          const meal = meals.find((entry) => entry.date === ymd) ?? null;
          // The main dish is usually the second line, after the rice.
          const headline =
            meal?.dishes[1]?.name ?? meal?.dishes[0]?.name ?? '메뉴 정보 없음';
          return {
            date: ymd,
            label: labelOf(ymd),
            headline,
            summary: summaries.get(ymd) ?? {
              average: null,
              count: 0,
              distribution: [0, 0, 0, 0, 0],
              topTag: null,
            },
          };
        })
        .filter((row) => row.summary.count > 0)
        .sort((a, b) => (b.summary.average ?? 0) - (a.summary.average ?? 0));

      setRows(next);
      setLoading(false);
    };

    void load();
    return () => {
      disposed = true;
    };
  }, [schoolKey, mealType, ymds]);

  return (
    <View style={[styles.card, shadow.sm]}>
      <View style={styles.header}>
        <Text style={styles.titleEmoji}>🏆</Text>
        <Text style={[text.subheading, styles.title]}>지난 급식 순위</Text>
      </View>

      {loading ? (
        <Text style={[text.caption, styles.empty]}>불러오는 중…</Text>
      ) : rows.length === 0 ? (
        <Text style={[text.caption, styles.empty]}>
          아직 비교할 지난 평가가 없어요. 매일 평가가 쌓이면 여기에 순위가 생겨요.
        </Text>
      ) : (
        rows.map((row, index) => (
          <View key={row.date} style={styles.row}>
            <Text style={[text.bodyStrong, styles.rank]}>{index + 1}</Text>
            <View style={styles.rowBody}>
              <Text style={[text.bodyStrong, styles.headline]} numberOfLines={1}>
                {row.headline}
              </Text>
              <Text style={[text.caption, styles.meta]}>
                {row.label} · {row.summary.count}개 평가
              </Text>
            </View>
            <View style={styles.rowScore}>
              <Text style={[text.bodyStrong, styles.average]}>
                {row.summary.average?.toFixed(1) ?? '–'}
              </Text>
              <StarRating value={row.summary.average ?? 0} size={11} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    gap: space(2.5),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  titleEmoji: { fontSize: 16 },
  title: { color: colors.text, letterSpacing: -0.2 },
  empty: { color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  rank: { color: colors.textMuted, width: 16, textAlign: 'center' },
  rowBody: { flex: 1, gap: space(0.5) },
  headline: { color: colors.text },
  meta: { color: colors.textMuted },
  rowScore: { alignItems: 'flex-end', gap: space(1) },
  average: { color: colors.text },
});
