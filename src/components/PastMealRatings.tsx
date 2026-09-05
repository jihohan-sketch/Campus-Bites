import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pill } from './Pill';
import { Skeleton } from './Skeleton';
import { StarRating } from './StarRating';
import { fetchMealsInRange } from '../config/school';
import { fetchSummaries } from '../services/ratings';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import type { MealRatingSummary, MealType } from '../types';
import { addDays, fromYmd, toYmd, weekdayName, type CivilDate } from '../utils/date';
import { foodEmoji } from '../utils/foodIcon';
import { FadeIn } from './motion';

interface PastMealRatingsProps {
  schoolKey: string;
  /** Today, as the anchor the history counts back from. */
  today: CivilDate;
  mealType: MealType;
  /** Signed-in uid, or `null` for a guest reading device-local ratings. */
  uid: string | null;
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

/** Gold, silver, bronze, then plain numerals. */
const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Past days ranked by score, so students can see which menus actually landed
 * rather than relying on memory.
 */
export function PastMealRatings({
  schoolKey,
  today,
  mealType,
  uid,
  days = 7,
}: PastMealRatingsProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const ymds = useMemo(
    () => Array.from({ length: days }, (_, index) => toYmd(addDays(today, -(index + 1)))),
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
          const headline = meal?.dishes[1]?.name ?? meal?.dishes[0]?.name ?? '메뉴 정보 없음';
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
    // `uid` is not a query input, but signing in swaps the local store
    // for the shared one, so the history has to be re-read.
  }, [schoolKey, mealType, ymds, uid]);

  return (
    <View style={[styles.card, t.shadow.sm]}>
      <View style={styles.header}>
        <Text style={styles.titleEmoji}>🏆</Text>
        <Text style={[text.subheading, styles.title]}>지난 급식 순위</Text>
        {/* Which service is being ranked, so an empty 조식 list does not read
            as "nobody has ever rated anything". */}
        <Pill
          label={t.meal[mealType].label}
          color={t.meal[mealType].tint}
          background={t.meal[mealType].soft}
        />
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((line) => (
            <View key={line} style={styles.skeletonRow}>
              <Skeleton width={28} height={28} round={10} />
              <View style={styles.skeletonText}>
                <Skeleton width="58%" height={14} />
                <Skeleton width="34%" height={11} />
              </View>
              <Skeleton width={34} height={16} />
            </View>
          ))}
        </View>
      ) : rows.length === 0 ? (
        <Text style={[text.caption, styles.empty]}>
          아직 비교할 지난 평가가 없어요. 매일 평가가 쌓이면 여기에 순위가 생겨요.
        </Text>
      ) : (
        rows.map((row, index) => (
          <FadeIn key={row.date} index={index} offset={8}>
            <View style={[styles.row, index === 0 ? styles.rowTop : null]}>
              <View style={[styles.rank, index === 0 ? { backgroundColor: t.colors.star } : null]}>
                <Text style={[text.label, index < MEDALS.length ? styles.medal : styles.rankText]}>
                  {MEDALS[index] ?? index + 1}
                </Text>
              </View>

              <View style={styles.rowBody}>
                <Text style={[text.bodyStrong, styles.headline]} numberOfLines={1}>
                  {foodEmoji(row.headline)} {row.headline}
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
          </FadeIn>
        ))
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: space(4.5),
      gap: space(3),
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
    titleEmoji: { fontSize: 16 },
    title: { color: t.colors.text },
    empty: { color: t.colors.textMuted },

    skeletons: { gap: space(3) },
    skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    skeletonText: { flex: 1, gap: space(2) },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      paddingVertical: space(2),
      paddingHorizontal: space(2),
      borderRadius: radius.md,
    },
    /** The winner gets a tinted lane; the rest stay quiet. */
    rowTop: { backgroundColor: t.colors.surfaceMuted },
    rank: {
      width: 28,
      height: 28,
      borderRadius: radius.xs,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surfaceMuted,
    },
    medal: { fontSize: 15 },
    rankText: { color: t.colors.textMuted, fontVariant: ['tabular-nums'] },
    rowBody: { flex: 1, gap: space(0.5) },
    headline: { color: t.colors.text },
    meta: { color: t.colors.textMuted, fontVariant: ['tabular-nums'] },
    rowScore: { alignItems: 'flex-end', gap: space(1) },
    average: { color: t.colors.text, fontVariant: ['tabular-nums'] },
  });
