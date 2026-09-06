import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { Button } from './Button';
import { Pill } from './Pill';
import { StarRating } from './StarRating';
import { TextField } from './TextField';
import { useMealRatings } from '../hooks/useMealRatings';
import { useNow } from '../hooks/useNow';
import { MEAL_TAGS, RATING_COMMENT_LIMIT } from '../services/ratings';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import type { Meal, MealRatingSummary, MealTag, MealType, StarValue, UserProfile } from '../types';
import { formatRelativeTime } from '../utils/date';
import { foodEmoji } from '../utils/foodIcon';
import { PressableScale, USE_NATIVE_DRIVER, useAnimatedTo, useChangeFade } from './motion';

const STAR_ROWS: StarValue[] = [5, 4, 3, 2, 1];

interface MealRatingPanelProps {
  schoolKey: string;
  /** `YYYYMMDD`. */
  date: string;
  mealType: MealType;
  meal: Meal | null;
  profile: UserProfile | null;
  /**
   * How to name {@link date} in the panel's own copy — `오늘의`, or
   * `9월 3일 (목)` when the student has paged 급식표 to another day. The panel
   * follows the menu on screen, so it must never call another day "오늘".
   */
  dayLabel?: string;
  /** False for a service that has not been served yet — the panel reads only. */
  ratable?: boolean;
  /** Offered when a past or future day is on screen, to jump back to today. */
  onGoToToday?: () => void;
  /** Sends a signed-out student to the sign-in screen; they can still read. */
  onRequestSignIn?: () => void;
}

/**
 * The student verdict on the meal being browsed: one score, one optional line,
 * and the running average everyone else has landed on.
 */
export function MealRatingPanel({
  schoolKey,
  date,
  mealType,
  meal,
  profile,
  dayLabel = '오늘의',
  ratable = true,
  onGoToToday,
  onRequestSignIn,
}: MealRatingPanelProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { ratings, summary, mine, loading, submitting, error, localOnly, canRate, submit } =
    useMealRatings(schoolKey, date, mealType, profile);

  const now = useNow(30000);
  const theme = t.meal[mealType];

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

  // The composer fades in rather than animating the layout around it:
  // `LayoutAnimation` animates the *whole* next layout pass, which on a long
  // scrolling page means every card below re-flows in step with the panel.
  const composerFade = useChangeFade(composerOpen);

  const toggleComposer = (open: boolean) => setComposerOpen(open);

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
  const reviews = ratings.filter((rating) => rating.comment.length > 0);

  return (
    <View style={[styles.card, t.shadow.sm]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>🍱</Text>
          <Text style={[text.subheading, styles.title]}>{dayLabel} 급식 평가</Text>
        </View>
        <View style={styles.headerChips}>
          {localOnly ? <Pill label="이 기기에만 저장" /> : null}
          <Pill label={`${summary.count}명 참여`} color={theme.tint} background={theme.soft} />
        </View>
      </View>

      {dishes.length > 0 ? (
        <View style={styles.menuRow}>
          {dishes.slice(0, 6).map((dish, index) => (
            <View key={`${dish.name}-${index}`} style={styles.menuChip}>
              <Text style={styles.menuChipEmoji}>{foodEmoji(dish.name)}</Text>
              <Text style={[text.caption, styles.menuChipText]}>{dish.name}</Text>
            </View>
          ))}
          {dishes.length > 6 ? (
            <Text style={[text.caption, styles.menuMore]}>외 {dishes.length - 6}가지</Text>
          ) : null}
        </View>
      ) : (
        <Text style={[text.caption, styles.menuMore]}>
          {dayLabel} {theme.label} 메뉴가 없어요
        </Text>
      )}

      <ScoreBlock summary={summary} loading={loading} celebrate={justSubmitted} />

      <Distribution summary={summary} />

      {error ? <Text style={[text.caption, styles.error]}>{error}</Text> : null}

      {composerOpen ? (
        <Animated.View style={[styles.composer, { opacity: composerFade }]}>
          <Text style={[text.label, styles.composerLabel]}>몇 점을 주시겠어요?</Text>
          <StarRating value={stars} onChange={setStars} size={36} />

          <Text style={[text.label, styles.composerLabel]}>한 마디로 고르면</Text>
          <View style={styles.tagRow}>
            {MEAL_TAGS.map((option) => {
              const tagTheme = t.tag[option];
              const active = tag === option;
              return (
                <PressableScale
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setTag(active ? null : option)}
                  scaleTo={0.94}
                  dim
                  style={[
                    styles.tagChip,
                    active ? { backgroundColor: tagTheme.soft, borderColor: tagTheme.color } : null,
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
                </PressableScale>
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
              tint={theme.tint}
              style={styles.composerButton}
            />
          </View>
        </Animated.View>
      ) : mine ? (
        <View style={[styles.mineCard, justSubmitted ? styles.mineCelebrate : null]}>
          <View style={styles.mineTop}>
            <Text style={[text.label, styles.mineLabel]}>
              {justSubmitted ? '✅ 평가가 반영됐어요' : '내가 남긴 평가'}
            </Text>
            <PressableScale
              accessibilityRole="button"
              onPress={() => toggleComposer(true)}
              scaleTo={0.9}
              dim
              style={styles.editLink}
            >
              <Text style={[text.caption, styles.editText]}>수정</Text>
              <Ionicons name="create-outline" size={13} color={t.colors.brand} />
            </PressableScale>
          </View>
          <StarRating value={mine.stars} size={18} />
          {mine.comment ? <Text style={[text.body, styles.mineComment]}>{mine.comment}</Text> : null}
          <Text style={[text.caption, styles.mineHint]}>한 급식당 한 번만 평가할 수 있어요</Text>
        </View>
      ) : !ratable ? (
        // A future service can be read but not scored, the same rule the card
        // on 급식표 follows.
        <View style={styles.signInCta}>
          <Text style={[text.caption, styles.signInHint]}>아직 평가할 수 없는 급식이에요</Text>
          {onGoToToday ? (
            <Button label="오늘로 이동" variant="secondary" onPress={onGoToToday} fullWidth />
          ) : null}
        </View>
      ) : canRate ? (
        <View style={styles.signInCta}>
          <Button
            label={`${dayLabel} 급식 평가하기`}
            onPress={() => toggleComposer(true)}
            size="lg"
            fullWidth
            tint={theme.tint}
            leading={<Ionicons name="star" size={17} color={t.colors.onAccent} />}
          />
          {onGoToToday ? (
            <Button label="오늘로 이동" variant="ghost" onPress={onGoToToday} fullWidth />
          ) : null}
        </View>
      ) : (
        // Reading is open to everyone; only the write needs an account, so the
        // score and the feed above stay visible behind this.
        <View style={styles.signInCta}>
          <Button
            label="로그인하고 평가하기"
            onPress={() => onRequestSignIn?.()}
            size="lg"
            fullWidth
            tint={theme.tint}
            leading={<Ionicons name="star" size={17} color={t.colors.onAccent} />}
          />
          <Text style={[text.caption, styles.signInHint]}>
            점수와 후기는 로그인 없이도 볼 수 있어요.
          </Text>
        </View>
      )}

      <View style={styles.feed}>
        <Text style={[text.label, styles.feedTitle]}>학생 후기</Text>
        {reviews.length === 0 ? (
          <Text style={[text.caption, styles.feedEmpty]}>
            아직 후기가 없어요. 첫 후기를 남겨 보세요.
          </Text>
        ) : (
          reviews.slice(0, 8).map((rating) => (
            <View key={rating.id} style={styles.reviewRow}>
              <Avatar emoji={rating.authorEmoji} photoUrl={rating.authorPhotoUrl} size={34} />
              <View style={styles.reviewBody}>
                <View style={styles.reviewTop}>
                  <Text style={[text.bodyStrong, styles.reviewName]} numberOfLines={1}>
                    {rating.raterId === mine?.raterId ? '나' : rating.authorName}
                  </Text>
                  <StarRating value={rating.stars} size={12} />
                  {rating.tag ? (
                    <Pill
                      label={`${t.tag[rating.tag].emoji} ${t.tag[rating.tag].label}`}
                      color={t.tag[rating.tag].color}
                      background={t.tag[rating.tag].soft}
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
  const t = useTheme();
  const styles = useStyles(makeStyles);
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
            label={`${t.tag[summary.topTag].emoji} ${t.tag[summary.topTag].label} 최다`}
            color={t.tag[summary.topTag].color}
            background={t.tag[summary.topTag].soft}
          />
        ) : null}
      </View>
    </View>
  );
}

/** 5★ down to 1★, each bar growing into place as votes arrive. */
function Distribution({ summary }: { summary: MealRatingSummary }) {
  const styles = useStyles(makeStyles);
  const max = Math.max(1, ...summary.distribution);

  return (
    <View style={styles.distribution}>
      {STAR_ROWS.map((star) => (
        <DistributionRow key={star} star={star} count={summary.distribution[star - 1]} max={max} />
      ))}
    </View>
  );
}

function DistributionRow({ star, count, max }: { star: StarValue; count: number; max: number }) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  // Width cannot be driven natively, so this one stays on the JS driver.
  const grow = useAnimatedTo(count / max, 520);

  return (
    <View style={styles.distributionRow}>
      <Text style={[text.caption, styles.distributionStar]}>{star}★</Text>
      <View style={styles.distributionTrack}>
        <Animated.View
          style={[
            styles.distributionFill,
            {
              backgroundColor: t.colors.star,
              width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
      <Text style={[text.caption, styles.distributionCount]}>{count}</Text>
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
      gap: space(4),
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space(2),
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
    titleEmoji: { fontSize: 16 },
    title: { color: t.colors.text },
    headerChips: { flexDirection: 'row', alignItems: 'center', gap: space(1.5), flexShrink: 1 },

    menuRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1.5), alignItems: 'center' },
    menuChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1),
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.pill,
      paddingHorizontal: space(2.5),
      paddingVertical: space(1.5),
    },
    menuChipEmoji: { fontSize: 12 },
    menuChipText: { color: t.colors.textSecondary, fontWeight: '600' },
    menuMore: { color: t.colors.textMuted },

    score: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space(3),
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.lg,
      padding: space(4),
    },
    scoreLeft: { gap: space(0.5) },
    scoreValue: { ...text.numeric, color: t.colors.text },
    scoreOutOf: { ...text.subheading, color: t.colors.textMuted },
    scoreCount: { color: t.colors.textSecondary },
    scoreRight: { alignItems: 'flex-end', gap: space(2) },

    distribution: { gap: space(1.5) },
    distributionRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
    distributionStar: { color: t.colors.textSecondary, width: 24, fontVariant: ['tabular-nums'] },
    distributionTrack: {
      flex: 1,
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: t.colors.track,
      overflow: 'hidden',
    },
    distributionFill: { height: '100%', borderRadius: radius.pill },
    distributionCount: {
      color: t.colors.textMuted,
      width: 28,
      textAlign: 'right',
      fontVariant: ['tabular-nums'],
    },

    error: { color: t.colors.danger },

    composer: {
      gap: space(3),
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.lg,
      padding: space(4),
    },
    composerLabel: { color: t.colors.textSecondary },
    composerActions: { flexDirection: 'row', gap: space(2) },
    composerButton: { flex: 1 },

    tagRow: { flexDirection: 'row', gap: space(2), flexWrap: 'wrap' },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1.5),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: space(3.5),
      paddingVertical: space(2.5),
    },
    tagEmoji: { fontSize: 14 },
    tagLabel: { color: t.colors.textSecondary, fontWeight: '600' },

    mineCard: {
      gap: space(2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      borderRadius: radius.lg,
      padding: space(4),
    },
    mineCelebrate: { borderColor: t.colors.success, backgroundColor: t.colors.successSoft },
    mineTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mineLabel: { color: t.colors.textSecondary },
    editLink: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
    editText: { color: t.colors.brand, fontWeight: '700' },
    mineComment: { color: t.colors.text },
    mineHint: { color: t.colors.textMuted },

    signInCta: { gap: space(2) },
    signInHint: { color: t.colors.textMuted, textAlign: 'center' },

    feed: { gap: space(3) },
    feedTitle: { color: t.colors.textSecondary },
    feedEmpty: { color: t.colors.textMuted },
    reviewRow: { flexDirection: 'row', gap: space(2.5) },
    reviewBody: { flex: 1, gap: space(1) },
    reviewTop: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
    reviewName: { color: t.colors.text },
    reviewComment: { color: t.colors.text },
    reviewMeta: { color: t.colors.textMuted },
  });
