import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APP_SCHOOL, MENU_COVERAGE, isBeyondMenuCoverage, schoolKeyOf } from '../../config/school';
import { CrowdMeter } from '../../components/CrowdMeter';
import { DayNavigator } from '../../components/DayNavigator';
import { EmptyState } from '../../components/EmptyState';
import { LunchLineLive } from '../../components/LunchLineLive';
import { MealCard } from '../../components/MealCard';
import { MealTypeTabs } from '../../components/MealTypeTabs';
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
import { MEAL_TYPES, type MealType } from '../../types';
import {
  formatKoreanDate,
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
    ratedMealType: defaultMeal,
    isRatable,
    goToToday,
  } = useSelectedDate();

  const { meals, status, error, refreshing, refresh } = useMeals(date);
  const { summary, now } = useCrowd(isToday ? schoolKeyOf() : null, profile?.uid ?? null);

  /** Which services have a published menu on this day. */
  const available = useMemo(
    () =>
      MEAL_TYPES.reduce(
        (acc, mealType) => ({ ...acc, [mealType]: meals[mealType] !== null }),
        {} as Record<MealType, boolean>,
      ),
    [meals],
  );

  const hasAnyMeal = MEAL_TYPES.some((mealType) => available[mealType]);

  /**
   * The service the tabs land on when the student has not picked one: whatever
   * is being served right now, and lunch on any other day — falling through to
   * the first service that actually has a menu, so an empty card is never the
   * first thing on screen when a real one exists.
   */
  const suggested = useMemo(() => {
    if (available[defaultMeal]) return defaultMeal;
    return MEAL_TYPES.find((mealType) => available[mealType]) ?? defaultMeal;
  }, [available, defaultMeal]);

  // A tap on the tabs sticks for as long as the student stays on that day;
  // paging to another date hands the choice back to `suggested`.
  const [picked, setPicked] = useState<MealType | null>(null);
  const dateKey = toYmd(date);
  useEffect(() => setPicked(null), [dateKey]);

  const selected = picked ?? suggested;
  const selectedMeal = meals[selected];

  // The page takes its temperature from the service on screen, so switching
  // tabs re-tints the whole background as well as the card.
  const bloom = t.meal[selected].soft;

  /** Distinguishes "not published yet" from "no meal that day". */
  const emptyReason = useMemo(() => {
    if (isWeekend(date)) return 'weekend' as const;
    return isBeyondMenuCoverage(toYmd(date)) ? ('unpublished' as const) : ('none' as const);
  }, [date]);

  const coverageEnd = useMemo(() => {
    const parsed = fromYmd(MENU_COVERAGE.last);
    return parsed ? formatKoreanDate(parsed) : '';
  }, []);

  const openDetail = useCallback(() => {
    if (selectedMeal) navigation.navigate('MealDetail', { meal: selectedMeal });
  }, [selectedMeal, navigation]);

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
            <View style={styles.headerText}>
              <Text style={[text.overline, styles.eyebrow]} numberOfLines={1}>
                {APP_SCHOOL.schoolName}
              </Text>
              <Text style={[text.hero, styles.title]}>
                {isToday ? '오늘 뭐 먹지?' : '이 날의 메뉴'}
              </Text>
            </View>
            <View style={[styles.headerMark, { backgroundColor: t.meal[selected].soft }]}>
              <Text style={styles.headerEmoji}>{t.meal[selected].emoji}</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn index={1}>
          <DayNavigator date={date} onChange={setDate} />
        </FadeIn>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={t.colors.warning} />
            <Text style={[text.caption, styles.errorText]}>{error}</Text>
          </View>
        ) : null}

        {status === 'loading' ? (
          <MealCardSkeleton index={0} />
        ) : !hasAnyMeal ? (
          <EmptyState
            emoji={emptyReason === 'weekend' ? '🛌' : emptyReason === 'unpublished' ? '🗓️' : '🍽️'}
            title={
              emptyReason === 'weekend'
                ? '주말에는 급식이 없어요'
                : emptyReason === 'unpublished'
                  ? '아직 메뉴가 올라오지 않았어요'
                  : '이 날은 급식이 없어요'
            }
            description={
              emptyReason === 'weekend'
                ? '다른 날짜를 골라 메뉴를 확인해 보세요.'
                : emptyReason === 'unpublished'
                  ? `지금은 ${coverageEnd}까지 볼 수 있어요. 새 메뉴가 올라오면 여기에 바로 나타나요.`
                  : '이 날은 급식 운영이 없는 날이에요.'
            }
            actionLabel="오늘 메뉴 보기"
            onAction={goToToday}
          />
        ) : (
          <>
            <FadeIn index={2}>
              <MealTypeTabs
                value={selected}
                onChange={setPicked}
                available={available}
                current={highlightedMeal}
              />
            </FadeIn>

            {/* Keyed on the service, so switching tabs plays the card's own
                entrance rather than swapping its contents in place. */}
            <FadeIn key={selected} index={0} offset={18}>
              <MealCard
                type={selected}
                meal={selectedMeal}
                isCurrent={highlightedMeal === selected && selectedMeal !== null}
                onPress={openDetail}
              />
            </FadeIn>
          </>
        )}

        {/* Below the menu, in the order a hungry student asks the questions:
            how long is the line, when should I go, and was it any good. */}
        {selected === 'lunch' && available.lunch ? (
          <FadeIn index={5}>
            <LunchLineLive muted={!isToday} compact />
          </FadeIn>
        ) : null}

        {selectedMeal !== null ? (
          <FadeIn index={6}>
            <TodayMealRatingCard
              schoolKey={schoolKeyOf()}
              date={toYmd(date)}
              mealType={selected}
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
                <Text style={[text.caption, styles.crowdHintText]}>급식실 혼잡도 보기</Text>
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

    header: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    headerText: { flex: 1, gap: space(1.5) },
    eyebrow: { color: t.colors.brand },
    title: { color: t.colors.text },
    headerMark: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerEmoji: { fontSize: 26 },

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
  });
