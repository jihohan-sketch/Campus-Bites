import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APP_SCHOOL, MENU_COVERAGE, isBeyondMenuCoverage, schoolKeyOf } from '../../config/school';
import { CrowdMeter } from '../../components/CrowdMeter';
import { DayNavigator } from '../../components/DayNavigator';
import { EmptyState } from '../../components/EmptyState';
import { LunchLineLive } from '../../components/LunchLineLive';
import { MealCard } from '../../components/MealCard';
import { PastMealRatings } from '../../components/PastMealRatings';
import { Screen } from '../../components/Screen';
import { TodayMealRatingCard } from '../../components/TodayMealRatingCard';
import { MealCardSkeleton } from '../../components/Skeleton';
import { FadeIn, PressableScale } from '../../components/motion';
import { useAuth } from '../../context/AuthContext';
import { useSelectedDate } from '../../context/SelectedDateContext';
import { useCrowd } from '../../hooks/useCrowd';
import { useMeals } from '../../hooks/useMeals';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../../theme';
import { MEAL_TYPES } from '../../types';
import {
  formatKoreanDate,
  formatLongKoreanDate,
  fromYmd,
  isWeekend,
  toYmd,
} from '../../utils/date';

type Props = BottomTabScreenProps<MainTabParamList, 'Meals'>;

export function MealsScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const { profile } = useAuth();

  // The browsed day is shared with 혼잡도, so the rating card on either tab
  // always describes the menu the student is actually looking at.
  const {
    date,
    setDate,
    today,
    isToday,
    currentService,
    highlightedMealType: highlightedMeal,
    ratedMealType: ratedMeal,
    isRatable,
    goToToday,
  } = useSelectedDate();

  const { meals, status, error, refreshing, refresh } = useMeals(date);
  const { summary, now } = useCrowd(isToday ? schoolKeyOf() : null, profile?.uid ?? null);

  // The page takes its temperature from whichever service is on right now.
  const bloom = t.meal[highlightedMeal ?? currentService].soft;

  const hasAnyMeal = MEAL_TYPES.some((mealType) => meals[mealType] !== null);

  /** Distinguishes "not published yet" from "no meal that day". */
  const emptyReason = useMemo(() => {
    if (isWeekend(date)) return 'weekend' as const;
    return isBeyondMenuCoverage(toYmd(date)) ? ('unpublished' as const) : ('none' as const);
  }, [date]);

  const coverageEnd = useMemo(() => {
    const parsed = fromYmd(MENU_COVERAGE.last);
    return parsed ? formatKoreanDate(parsed) : '';
  }, []);

  const openDetail = useCallback(
    (mealType: (typeof MEAL_TYPES)[number]) => {
      const meal = meals[mealType];
      if (meal) navigation.navigate('MealDetail', { meal });
    },
    [meals, navigation],
  );

  return (
    <Screen bloom={bloom}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={t.colors.brand}
            colors={[t.colors.brand]}
          />
        }
      >
        <FadeIn index={0}>
          <View style={styles.header}>
            <Text style={[text.overline, styles.eyebrow]} numberOfLines={1}>
              {APP_SCHOOL.schoolName}
            </Text>
            <Text style={[text.hero, styles.title]}>급식표</Text>
            <Text style={[text.body, styles.dateLine]}>{formatLongKoreanDate(date)}</Text>
          </View>
        </FadeIn>

        <FadeIn index={1}>
          <View style={styles.navigator}>
            <DayNavigator date={date} onChange={setDate} />
          </View>
        </FadeIn>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={t.colors.warning} />
            <Text style={[text.caption, styles.errorText]}>{error}</Text>
          </View>
        ) : null}

        {status === 'loading' ? (
          <View style={styles.cards}>
            <MealCardSkeleton index={0} />
            <MealCardSkeleton index={1} />
          </View>
        ) : !hasAnyMeal ? (
          <EmptyState
            emoji={emptyReason === 'weekend' ? '🛌' : emptyReason === 'unpublished' ? '🗓️' : '🍽️'}
            title={
              emptyReason === 'weekend'
                ? '주말에는 급식이 없어요'
                : emptyReason === 'unpublished'
                  ? '아직 식단표가 등록되지 않았어요'
                  : '이 날은 급식이 없어요'
            }
            description={
              emptyReason === 'weekend'
                ? '다른 날짜를 골라 급식표를 확인해 보세요.'
                : emptyReason === 'unpublished'
                  ? `현재 ${coverageEnd}까지 등록되어 있어요. 새 식단표가 올라오면 여기에 바로 표시돼요.`
                  : '이 날은 급식 운영이 없는 날이에요.'
            }
            actionLabel="오늘로 이동"
            onAction={goToToday}
          />
        ) : (
          <View style={styles.cards}>
            {MEAL_TYPES.map((mealType, index) => (
              <FadeIn key={mealType} index={index + 2}>
                <MealCard
                  type={mealType}
                  meal={meals[mealType]}
                  isCurrent={highlightedMeal === mealType && meals[mealType] !== null}
                  onPress={() => openDetail(mealType)}
                />
              </FadeIn>
            ))}
          </View>
        )}

        {/* Below the menu, in the order a hungry student asks the questions:
            how long is the line, when should I go, and was it any good. */}
        {hasAnyMeal && meals.lunch !== null ? (
          <FadeIn index={5}>
            <LunchLineLive muted={!isToday} compact />
          </FadeIn>
        ) : null}

        {hasAnyMeal && meals[ratedMeal] !== null ? (
          <FadeIn index={6}>
            <TodayMealRatingCard
              schoolKey={schoolKeyOf()}
              date={toYmd(date)}
              mealType={ratedMeal}
              profile={profile}
              ratable={isRatable}
              onRequestSignIn={() => navigation.navigate('SignIn')}
              onSeeAll={() => navigation.navigate('Main', { screen: 'Cafeteria' })}
            />
          </FadeIn>
        ) : null}

        {isToday && summary.reportCount > 0 ? (
          <FadeIn index={7}>
            <PressableScale
              accessibilityRole="button"
              onPress={() => navigation.navigate('Main', { screen: 'Cafeteria' })}
              scaleTo={0.985}
              style={styles.crowdLink}
            >
              <CrowdMeter summary={summary} now={now} />
              <View style={styles.crowdHint}>
                <Text style={[text.caption, styles.crowdHintText]}>급식실 혼잡도 자세히 보기</Text>
                <Ionicons name="chevron-forward" size={13} color={t.colors.textSecondary} />
              </View>
            </PressableScale>
          </FadeIn>
        ) : null}

        <FadeIn index={8}>
          {/* The ranking always counts back from today, so it stays on today's
              service rather than swapping when the student pages to another day. */}
          <PastMealRatings
            schoolKey={schoolKeyOf()}
            today={today}
            mealType={currentService}
            uid={profile?.uid ?? null}
          />
        </FadeIn>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    // The tab bar floats over the content, so the last card needs room to clear it.
    content: { padding: space(5), paddingBottom: space(30), gap: space(5) },
    header: { gap: space(1.5) },
    eyebrow: { color: t.colors.brand },
    title: { color: t.colors.text },
    dateLine: { color: t.colors.textSecondary },
    navigator: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: space(4.5),
      ...t.shadow.sm,
    },
    crowdLink: { gap: space(2) },
    crowdHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space(1),
    },
    crowdHintText: { color: t.colors.textSecondary, fontWeight: '700' },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(2),
      backgroundColor: t.colors.warningSoft,
      borderRadius: radius.md,
      paddingHorizontal: space(4),
      paddingVertical: space(3.5),
    },
    errorText: { color: t.colors.warning, flex: 1 },
    cards: { gap: space(4) },
  });
