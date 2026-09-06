import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { Button } from './Button';
import { Pill } from './Pill';
import { StarRating } from './StarRating';
import { TextField } from './TextField';
import { useMealRatings } from '../hooks/useMealRatings';
import { RATING_COMMENT_LIMIT } from '../services/ratings';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import type { MealType, StarValue, UserProfile } from '../types';
import { PressableScale, USE_NATIVE_DRIVER, useChangeFade } from './motion';

/** Reviews are a taste of the conversation here, not the whole feed. */
const PREVIEW_REVIEWS = 2;

interface TodayMealRatingCardProps {
  schoolKey: string;
  /** `YYYYMMDD`. */
  date: string;
  mealType: MealType;
  profile: UserProfile | null;
  /** False for a service that has not happened yet — the card reads only. */
  ratable?: boolean;
  /** Sends a signed-out student to the sign-in screen; they can still read. */
  onRequestSignIn?: () => void;
  /** Opens the full rating panel, where every review lives. */
  onSeeAll?: () => void;
}

/**
 * The compact verdict on today's meal, sized to sit under Lunch Line Live on
 * the home screen: the running score, how many students are behind it, and a
 * one-tap way to add your own.
 *
 * The full panel on 급식실 (`MealRatingPanel`) stays the place for the star
 * distribution, tags and the complete feed — this card shares its data through
 * `useMealRatings`, so a rating left here shows up there immediately.
 */
export function TodayMealRatingCard({
  schoolKey,
  date,
  mealType,
  profile,
  ratable = true,
  onRequestSignIn,
  onSeeAll,
}: TodayMealRatingCardProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const theme = t.meal[mealType];

  const { ratings, summary, mine, loading, submitting, error, localOnly, canRate, submit } =
    useMealRatings(schoolKey, date, mealType, profile);

  const [composerOpen, setComposerOpen] = useState(false);
  const [stars, setStars] = useState<StarValue>(mine?.stars ?? 5);
  const [comment, setComment] = useState(mine?.comment ?? '');
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Reopening the composer should show what the student said last time.
  useEffect(() => {
    if (composerOpen) return;
    setStars(mine?.stars ?? 5);
    setComment(mine?.comment ?? '');
  }, [mine, composerOpen]);

  useEffect(() => {
    if (!justSubmitted) return;
    const timer = setTimeout(() => setJustSubmitted(false), 2600);
    return () => clearTimeout(timer);
  }, [justSubmitted]);

  const onSubmit = async () => {
    const ok = await submit({ stars, tag: null, comment });
    if (!ok) return;
    setComposerOpen(false);
    setJustSubmitted(true);
  };

  const reviews = ratings.filter((rating) => rating.comment.length > 0);
  const preview = reviews.slice(0, PREVIEW_REVIEWS);
  const moreReviews = reviews.length - preview.length;

  return (
    <View style={[styles.card, t.shadow.sm]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>🍱</Text>
          <Text style={[text.subheading, styles.title]}>오늘의 급식 평가</Text>
        </View>
        {localOnly ? (
          <Pill label="이 기기에만 저장" />
        ) : (
          <Pill label={theme.label} color={theme.tint} background={theme.soft} />
        )}
      </View>

      <Score summary={summary} loading={loading} celebrate={justSubmitted} />

      {error ? <Text style={[text.caption, styles.error]}>{error}</Text> : null}

      {composerOpen ? (
        <Composer
          stars={stars}
          onStars={setStars}
          comment={comment}
          onComment={setComment}
          submitting={submitting}
          editing={Boolean(mine)}
          tint={theme.tint}
          onCancel={() => setComposerOpen(false)}
          onSubmit={onSubmit}
        />
      ) : mine ? (
        <MyRating
          stars={mine.stars}
          comment={mine.comment}
          celebrate={justSubmitted}
          onEdit={() => setComposerOpen(true)}
        />
      ) : !ratable ? (
        <Text style={[text.caption, styles.notYet]}>아직 평가할 수 없는 급식이에요</Text>
      ) : canRate ? (
        <Button
          label="오늘 급식 평가하기"
          onPress={() => setComposerOpen(true)}
          size="lg"
          fullWidth
          tint={theme.tint}
          leading={<Ionicons name="star" size={17} color={t.colors.onAccent} />}
        />
      ) : (
        // Reading is open to everyone; only writing needs an account.
        <Button
          label="로그인하고 평가하기"
          onPress={() => onRequestSignIn?.()}
          size="lg"
          fullWidth
          tint={theme.tint}
          leading={<Ionicons name="star" size={17} color={t.colors.onAccent} />}
        />
      )}

      {preview.length > 0 ? (
        <View style={styles.reviews}>
          {preview.map((rating) => (
            <View key={rating.id} style={styles.reviewRow}>
              <Avatar emoji={rating.authorEmoji} photoUrl={rating.authorPhotoUrl} size={28} />
              <View style={styles.reviewBody}>
                <View style={styles.reviewTop}>
                  <Text style={[text.label, styles.reviewName]} numberOfLines={1}>
                    {rating.raterId === mine?.raterId ? '나' : rating.authorName}
                  </Text>
                  <StarRating value={rating.stars} size={11} />
                </View>
                <Text style={[text.caption, styles.reviewComment]} numberOfLines={2}>
                  {rating.comment}
                </Text>
              </View>
            </View>
          ))}

          {onSeeAll ? (
            <PressableScale
              accessibilityRole="button"
              onPress={onSeeAll}
              scaleTo={0.96}
              dim
              style={styles.moreLink}
            >
              <Text style={[text.caption, styles.moreText]}>
                {moreReviews > 0 ? `후기 ${moreReviews}개 더 보기` : '후기 전체 보기'}
              </Text>
              <Ionicons name="chevron-forward" size={13} color={t.colors.brand} />
            </PressableScale>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ score */

/** ★★★★☆ 4.2 / 5 plus the headcount behind it. */
function Score({
  summary,
  loading,
  celebrate,
}: {
  summary: { average: number | null; count: number };
  loading: boolean;
  celebrate: boolean;
}) {
  const styles = useStyles(makeStyles);
  const average = summary.average;

  // The score fades to its new value when the average moves; a submission of
  // your own also lifts it slightly, so the card acknowledges the tap.
  const fade = useChangeFade(average);
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!celebrate) return;
    const animation = Animated.sequence([
      Animated.timing(pop, {
        toValue: 1.06,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(pop, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [celebrate, pop]);

  return (
    <Animated.View style={[styles.score, { opacity: fade, transform: [{ scale: pop }] }]}>
      <StarRating value={average ?? 0} size={20} />
      <Text style={[text.heading, styles.scoreValue]}>
        {average === null ? '–' : average.toFixed(1)}
        <Text style={styles.scoreOutOf}> / 5</Text>
      </Text>
      <Text style={[text.caption, styles.scoreCount]} numberOfLines={1}>
        {loading
          ? '불러오는 중…'
          : summary.count === 0
            ? '아직 평가가 없어요'
            : `학생 ${summary.count}명이 평가했어요`}
      </Text>
    </Animated.View>
  );
}

/* --------------------------------------------------------------- composer */

function Composer({
  stars,
  onStars,
  comment,
  onComment,
  submitting,
  editing,
  tint,
  onCancel,
  onSubmit,
}: {
  stars: StarValue;
  onStars: (value: StarValue) => void;
  comment: string;
  onComment: (value: string) => void;
  submitting: boolean;
  editing: boolean;
  tint: string;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const styles = useStyles(makeStyles);
  // The composer fades in rather than animating its height — a layout
  // animation here would fight the scroll view it sits inside.
  const enter = useChangeFade('composer');

  return (
    <Animated.View style={[styles.composer, { opacity: enter }]}>
      <Text style={[text.label, styles.composerLabel]}>몇 점을 주시겠어요?</Text>
      <StarRating value={stars} onChange={onStars} size={34} />

      <TextField
        label="한 줄 후기 (선택)"
        value={comment}
        onChangeText={onComment}
        placeholder="오늘 치킨 진짜 맛있었어요"
        maxLength={RATING_COMMENT_LIMIT}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      <View style={styles.composerActions}>
        <Button label="취소" variant="ghost" onPress={onCancel} style={styles.composerButton} />
        <Button
          label={editing ? '평가 수정하기' : '평가 남기기'}
          onPress={onSubmit}
          loading={submitting}
          tint={tint}
          style={styles.composerButton}
        />
      </View>
    </Animated.View>
  );
}

function MyRating({
  stars,
  comment,
  celebrate,
  onEdit,
}: {
  stars: StarValue;
  comment: string;
  celebrate: boolean;
  onEdit: () => void;
}) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const fade = useChangeFade(celebrate);

  return (
    <Animated.View style={[styles.mine, celebrate ? styles.mineCelebrate : null, { opacity: fade }]}>
      <View style={styles.mineTop}>
        <Text style={[text.label, styles.mineLabel]} numberOfLines={1}>
          {celebrate ? '✅ 평가가 반영됐어요' : '내가 남긴 평가'}
        </Text>
        <PressableScale
          accessibilityRole="button"
          onPress={onEdit}
          scaleTo={0.9}
          dim
          hitSlop={8}
          style={styles.editLink}
        >
          <Text style={[text.caption, styles.editText]}>수정</Text>
          <Ionicons name="create-outline" size={13} color={t.colors.brand} />
        </PressableScale>
      </View>
      <View style={styles.mineBody}>
        <StarRating value={stars} size={16} />
        {comment ? (
          <Text style={[text.caption, styles.mineComment]} numberOfLines={2}>
            {comment}
          </Text>
        ) : null}
      </View>
    </Animated.View>
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
      gap: space(3.5),
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

    score: { flexDirection: 'row', alignItems: 'center', gap: space(2.5), flexWrap: 'wrap' },
    scoreValue: { color: t.colors.text, fontVariant: ['tabular-nums'] },
    scoreOutOf: { color: t.colors.textMuted, fontWeight: '600' },
    scoreCount: { color: t.colors.textSecondary, flexShrink: 1 },

    error: { color: t.colors.danger },
    notYet: { color: t.colors.textMuted },

    composer: {
      gap: space(3),
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.lg,
      padding: space(4),
    },
    composerLabel: { color: t.colors.textSecondary },
    composerActions: { flexDirection: 'row', gap: space(2) },
    composerButton: { flex: 1 },

    mine: {
      gap: space(2),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      borderRadius: radius.lg,
      paddingHorizontal: space(3.5),
      paddingVertical: space(3),
    },
    mineCelebrate: { borderColor: t.colors.success, backgroundColor: t.colors.successSoft },
    mineTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space(2),
    },
    mineLabel: { color: t.colors.textSecondary, flexShrink: 1 },
    mineBody: { gap: space(1.5) },
    mineComment: { color: t.colors.text },
    editLink: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
    editText: { color: t.colors.brand, fontWeight: '700' },

    reviews: {
      gap: space(2.5),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.divider,
      paddingTop: space(3),
    },
    reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(2.5) },
    reviewBody: { flex: 1, gap: space(0.5) },
    reviewTop: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
    reviewName: { color: t.colors.text, flexShrink: 1 },
    reviewComment: { color: t.colors.textSecondary },
    moreLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space(1),
      // A comfortable target on a phone without adding a whole row of height.
      paddingVertical: space(2),
    },
    moreText: { color: t.colors.brand, fontWeight: '700' },
  });
