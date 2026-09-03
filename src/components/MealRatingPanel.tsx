import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { Avatar } from './Avatar';
import { Button } from './Button';
import { Pill } from './Pill';
import { StarRating } from './StarRating';
import { TextField } from './TextField';
import { useMealRatings } from '../hooks/useMealRatings';
import { useNow } from '../hooks/useNow';
import { MEAL_TAGS, RATING_COMMENT_LIMIT, mealTagTheme } from '../services/ratings';
import { colors, mealTheme, radius, shadow, space, type as text } from '../theme';
import type { Meal, MealRatingSummary, MealTag, MealType, StarValue, UserProfile } from '../types';
import { formatRelativeTime } from '../utils/date';

/** react-native-web has no native animation module; driving there warns. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STAR_ROWS: StarValue[] = [5, 4, 3, 2, 1];

interface MealRatingPanelProps {
  schoolKey: string;
  /** `YYYYMMDD`. */
  date: string;
  mealType: MealType;
  meal: Meal | null;
  profile: UserProfile | null;
}

/**
 * The student verdict on today's meal: one score, one optional line, and the
 * running average everyone else has landed on.
 */
export function MealRatingPanel({
  schoolKey,
  date,
  mealType,
  meal,
  profile,
}: MealRatingPanelProps) {
  const { ratings, summary, mine, loading, submitting, error, localOnly, submit } =
    useMealRatings(schoolKey, date, mealType, profile);

  const now = useNow(30000);
  const theme = mealTheme[mealType];

  const [composerOpen, setComposerOpen] = useState(false);
  const [stars, setStars] = useState<StarValue>(mine?.stars ?? 5);
  const [tag, setTag] = useState<MealTag | null>(mine?.tag ?? null);
  const [comment, setComment] = useState(mine?.comment ?? '');
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Reopening the composer should show what the student said last time.
  useEffect(() => {
    if (composerOpen) return;
    setStars(mine?.stars ?? 5);
    setTag(mine?.tag ?? null);
    setComment(mine?.comment ?? '');
  }, [mine, composerOpen]);

  const toggleComposer = (open: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setComposerOpen(open);
  };

  const onSubmit = async () => {
    const ok = await submit({ stars, tag, comment });
    if (!ok) return;
    toggleComposer(false);
    setJustSubmitted(true);
  };

  useEffect(() => {
    if (!justSubmitted) return;
    const timer = setTimeout(() => setJustSubmitted(false), 2600);
    return () => clearTimeout(timer);
  }, [justSubmitted]);

  const dishes = meal?.dishes ?? [];

  return (
    <View style={[styles.card, shadow.sm]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>🍱</Text>
          <Text style={[text.subheading, styles.title]}>오늘의 급식 평가</Text>
        </View>
        <View style={styles.headerChips}>
          {localOnly ? <Pill label="이 기기에만 저장" /> : null}
          <Pill
            label={`${summary.count}명 참여`}
            color={theme.tint}
            background={theme.soft}
          />
        </View>
      </View>

      {dishes.length > 0 ? (
        <View style={styles.menuRow}>
          {dishes.slice(0, 6).map((dish, index) => (
            <View key={`${dish.name}-${index}`} style={styles.menuChip}>
              <Text style={[text.caption, styles.menuChipText]}>{dish.name}</Text>
            </View>
          ))}
          {dishes.length > 6 ? (
            <Text style={[text.caption, styles.menuMore]}>외 {dishes.length - 6}가지</Text>
          ) : null}
        </View>
      ) : (
        <Text style={[text.caption, styles.menuMore]}>오늘 {theme.label} 메뉴가 없어요</Text>
      )}

      <ScoreBlock summary={summary} loading={loading} celebrate={justSubmitted} />

      <Distribution summary={summary} />

      {error ? <Text style={[text.caption, styles.error]}>{error}</Text> : null}

      {composerOpen ? (
        <View style={styles.composer}>
          <Text style={[text.label, styles.composerLabel]}>몇 점을 주시겠어요?</Text>
          <StarRating value={stars} onChange={setStars} size={34} />

          <Text style={[text.label, styles.composerLabel]}>한 마디로 고르면</Text>
          <View style={styles.tagRow}>
            {MEAL_TAGS.map((option) => {
              const tagTheme = mealTagTheme[option];
              const active = tag === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTag(active ? null : option)}
                  style={({ pressed }) => [
                    styles.tagChip,
                    active
                      ? { backgroundColor: tagTheme.soft, borderColor: tagTheme.color }
                      : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.tagEmoji}>{tagTheme.emoji}</Text>
                  <Text
                    style={[
                      text.caption,
                      styles.tagLabel,
                      active ? { color: tagTheme.color, fontWeight: '700' } : null,
                    ]}
                  >
                    {tagTheme.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextField
            label="한 줄 후기 (선택)"
            value={comment}
            onChangeText={setComment}
            placeholder="오늘 치킨 진짜 맛있었어요"
            maxLength={RATING_COMMENT_LIMIT}
            multiline
            hint={`${comment.length}/${RATING_COMMENT_LIMIT}`}
          />

          <View style={styles.composerActions}>
            <Button
              label="취소"
              variant="ghost"
              onPress={() => toggleComposer(false)}
              style={styles.composerButton}
            />
            <Button
              label={mine ? '평가 수정하기' : '평가 남기기'}
              onPress={onSubmit}
              loading={submitting}
              style={styles.composerButton}
            />
          </View>
        </View>
      ) : mine ? (
        <View style={[styles.mineCard, justSubmitted ? styles.mineCelebrate : null]}>
          <View style={styles.mineTop}>
            <Text style={[text.label, styles.mineLabel]}>
              {justSubmitted ? '✅ 평가가 반영됐어요' : '내가 남긴 평가'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => toggleComposer(true)}
              style={({ pressed }) => [styles.editLink, pressed ? styles.pressed : null]}
            >
              <Text style={[text.caption, styles.editText]}>수정</Text>
              <Ionicons name="create-outline" size={13} color={colors.brand} />
            </Pressable>
          </View>
          <StarRating value={mine.stars} size={18} />
          {mine.comment ? (
            <Text style={[text.body, styles.mineComment]}>{mine.comment}</Text>
          ) : null}
          <Text style={[text.caption, styles.mineHint]}>
            한 급식당 한 번만 평가할 수 있어요
          </Text>
        </View>
      ) : (
        <Button
          label="오늘 급식 평가하기"
          onPress={() => toggleComposer(true)}
          size="lg"
          fullWidth
          leading={<Ionicons name="star-outline" size={18} color={colors.white} />}
        />
      )}

      <View style={styles.feed}>
        <Text style={[text.label, styles.feedTitle]}>학생 후기</Text>
        {ratings.filter((rating) => rating.comment.length > 0).length === 0 ? (
          <Text style={[text.caption, styles.feedEmpty]}>
            아직 후기가 없어요. 첫 후기를 남겨 보세요.
          </Text>
        ) : (
          ratings
            .filter((rating) => rating.comment.length > 0)
            .slice(0, 8)
            .map((rating) => (
              <View key={rating.id} style={styles.reviewRow}>
                <Avatar emoji={rating.authorEmoji} size={34} />
                <View style={styles.reviewBody}>
                  <View style={styles.reviewTop}>
                    <Text style={[text.bodyStrong, styles.reviewName]} numberOfLines={1}>
                      {rating.raterId === mine?.raterId ? '나' : rating.authorName}
                    </Text>
                    <StarRating value={rating.stars} size={12} />
                    {rating.tag ? (
                      <Pill
                        label={`${mealTagTheme[rating.tag].emoji} ${mealTagTheme[rating.tag].label}`}
                        color={mealTagTheme[rating.tag].color}
                        background={mealTagTheme[rating.tag].soft}
                      />
                    ) : null}
                  </View>
                  <Text style={[text.body, styles.reviewComment]}>{rating.comment}</Text>
                  <Text style={[text.caption, styles.reviewMeta]}>
                    {formatRelativeTime(rating.createdAt, now)}
                  </Text>
                </View>
              </View>
            ))
        )}
      </View>
    </View>
  );
}

/** The headline score, which animates whenever the average moves. */
function ScoreBlock({
  summary,
  loading,
  celebrate,
}: {
  summary: MealRatingSummary;
  loading: boolean;
  celebrate: boolean;
}) {
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pop, {
        toValue: celebrate ? 1.14 : 1.06,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(pop, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [summary.average, summary.count, celebrate, pop]);

  const average = summary.average;

  return (
    <View style={styles.score}>
      <Animated.View style={[styles.scoreLeft, { transform: [{ scale: pop }] }]}>
        <Text style={styles.scoreValue}>
          {average === null ? '–' : average.toFixed(1)}
          <Text style={styles.scoreOutOf}> / 5</Text>
        </Text>
        <Text style={[text.caption, styles.scoreCount]}>
          {loading ? '불러오는 중…' : `${summary.count}개 평가`}
        </Text>
      </Animated.View>

      <View style={styles.scoreRight}>
        <StarRating value={average ?? 0} size={22} />
        {summary.topTag ? (
          <Pill
            label={`${mealTagTheme[summary.topTag].emoji} ${mealTagTheme[summary.topTag].label} 최다`}
            color={mealTagTheme[summary.topTag].color}
            background={mealTagTheme[summary.topTag].soft}
          />
        ) : null}
      </View>
    </View>
  );
}

/** 5★ down to 1★, each bar growing into place as votes arrive. */
function Distribution({ summary }: { summary: MealRatingSummary }) {
  const max = Math.max(1, ...summary.distribution);

  return (
    <View style={styles.distribution}>
      {STAR_ROWS.map((star) => (
        <DistributionRow
          key={star}
          star={star}
          count={summary.distribution[star - 1]}
          max={max}
        />
      ))}
    </View>
  );
}

function DistributionRow({
  star,
  count,
  max,
}: {
  star: StarValue;
  count: number;
  max: number;
}) {
  const grow = useRef(new Animated.Value(0)).current;
  const target = count / max;

  useEffect(() => {
    Animated.timing(grow, {
      toValue: target,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      // Width cannot be driven natively.
      useNativeDriver: false,
    }).start();
  }, [target, grow]);

  return (
    <View style={styles.distributionRow}>
      <Text style={[text.caption, styles.distributionStar]}>{star}★</Text>
      <View style={styles.distributionTrack}>
        <Animated.View
          style={[
            styles.distributionFill,
            {
              width: grow.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={[text.caption, styles.distributionCount]}>{count}</Text>
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
    gap: space(3.5),
  },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(2) },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  titleEmoji: { fontSize: 16 },
  title: { color: colors.text, letterSpacing: -0.2 },
  headerChips: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), flexShrink: 1 },

  menuRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1.5), alignItems: 'center' },
  menuChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: space(2),
    paddingVertical: space(1),
  },
  menuChipText: { color: colors.textSecondary },
  menuMore: { color: colors.textMuted },

  score: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space(3),
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space(3.5),
  },
  scoreLeft: { gap: space(0.5) },
  scoreValue: { ...text.display, color: colors.text, fontSize: 40, lineHeight: 44 },
  scoreOutOf: { ...text.subheading, color: colors.textMuted },
  scoreCount: { color: colors.textSecondary },
  scoreRight: { alignItems: 'flex-end', gap: space(2) },

  distribution: { gap: space(1) },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  distributionStar: { color: colors.textSecondary, width: 24 },
  distributionTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  distributionFill: { height: '100%', borderRadius: radius.pill, backgroundColor: '#E8952F' },
  distributionCount: { color: colors.textMuted, width: 28, textAlign: 'right' },

  error: { color: colors.danger },

  composer: {
    gap: space(2.5),
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space(3.5),
  },
  composerLabel: { color: colors.textSecondary },
  composerActions: { flexDirection: 'row', gap: space(2) },
  composerButton: { flex: 1 },

  tagRow: { flexDirection: 'row', gap: space(2), flexWrap: 'wrap' },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1.5),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
  },
  tagEmoji: { fontSize: 14 },
  tagLabel: { color: colors.textSecondary, fontWeight: '600' },
  pressed: { opacity: 0.85 },

  mineCard: {
    gap: space(1.5),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space(3.5),
  },
  mineCelebrate: { borderColor: colors.success, backgroundColor: colors.successSoft },
  mineTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mineLabel: { color: colors.textSecondary },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  editText: { color: colors.brand, fontWeight: '700' },
  mineComment: { color: colors.text },
  mineHint: { color: colors.textMuted },

  feed: { gap: space(2.5) },
  feedTitle: { color: colors.textSecondary },
  feedEmpty: { color: colors.textMuted },
  reviewRow: { flexDirection: 'row', gap: space(2.5) },
  reviewBody: { flex: 1, gap: space(1) },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  reviewName: { color: colors.text },
  reviewComment: { color: colors.text },
  reviewMeta: { color: colors.textMuted },
});
