import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APP_SCHOOL, schoolKeyOf } from '../../config/school';
import { CrowdMeter } from '../../components/CrowdMeter';
import { DayNavigator } from '../../components/DayNavigator';
import { EmptyState } from '../../components/EmptyState';
import { LunchLineLive } from '../../components/LunchLineLive';
import { MealCard } from '../../components/MealCard';
import { Screen } from '../../components/Screen';
import { MealCardSkeleton } from '../../components/Skeleton';
import { useCrowd } from '../../hooks/useCrowd';
import { useMeals } from '../../hooks/useMeals';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { colors, radius, space, type } from '../../theme';
import { MEAL_TYPES } from '../../types';
import {
  currentHourInKst,
  formatLongKoreanDate,
  isSameDate,
  isWeekend,
  todayInKst,
  type CivilDate,
} from '../../utils/date';
import { currentMealType } from '../../utils/meal';

type Props = BottomTabScreenProps<MainTabParamList, 'Meals'>;

export function MealsScreen(_props: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [date, setDate] = useState<CivilDate>(() => todayInKst());
  const today = useMemo(() => todayInKst(), []);
  const isToday = isSameDate(date, today);

  const { meals, status, error, refreshing, refresh } = useMeals(date);
  const { summary, now } = useCrowd(isToday ? schoolKeyOf() : null);

  const highlightedMeal = useMemo(
    () => (isToday ? currentMealType(currentHourInKst()) : null),
    [isToday],
  );

  const hasAnyMeal = MEAL_TYPES.some((mealType) => meals[mealType] !== null);

  const openDetail = useCallback(
    (mealType: (typeof MEAL_TYPES)[number]) => {
      const meal = meals[mealType];
      if (meal) navigation.navigate('MealDetail', { meal });
    },
    [meals, navigation],
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[type.caption, styles.eyebrow]} numberOfLines={1}>
              {APP_SCHOOL.schoolName}
            </Text>
            <Text style={[type.display, styles.title]}>급식표</Text>
            <Text style={[type.caption, styles.dateLine]}>{formatLongKoreanDate(date)}</Text>
          </View>
        </View>

        <View style={styles.navigator}>
          <DayNavigator date={date} onChange={setDate} />
        </View>

        {isToday && summary.reportCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Main', { screen: 'Cafeteria' })}
            style={({ pressed }) => [styles.crowdLink, pressed ? styles.pressed : null]}
          >
            <CrowdMeter summary={summary} now={now} />
            <View style={styles.crowdHint}>
              <Text style={[type.caption, styles.crowdHintText]}>급식실 혼잡도 자세히 보기</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </View>
          </Pressable>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
            <Text style={[type.caption, styles.errorText]}>{error}</Text>
          </View>
        ) : null}

        {status === 'loading' ? (
          <View style={styles.cards}>
            <MealCardSkeleton />
            <MealCardSkeleton />
          </View>
        ) : !hasAnyMeal ? (
          <EmptyState
            emoji={isWeekend(date) ? '🛌' : '🍽️'}
            title={isWeekend(date) ? '주말에는 급식이 없어요' : '이 날은 급식이 없어요'}
            description={
              isWeekend(date)
                ? '다른 날짜를 골라 급식표를 확인해 보세요.'
                : '방학이거나 아직 급식표가 올라오지 않았을 수 있어요.'
            }
            actionLabel="오늘로 이동"
            onAction={() => setDate(todayInKst())}
          />
        ) : (
          <View style={styles.cards}>
            {MEAL_TYPES.map((mealType) => (
              <React.Fragment key={mealType}>
                <MealCard
                  type={mealType}
                  meal={meals[mealType]}
                  isCurrent={highlightedMeal === mealType && meals[mealType] !== null}
                  onPress={() => openDetail(mealType)}
                />
                {mealType === 'lunch' && meals.lunch !== null ? (
                  <LunchLineLive muted={!isToday} compact />
                ) : null}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), paddingBottom: space(10), gap: space(5) },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  headerText: { flex: 1, gap: space(1) },
  eyebrow: { color: colors.brand, fontWeight: '700', letterSpacing: 0.4 },
  title: { color: colors.text },
  dateLine: { color: colors.textSecondary },
  navigator: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
  },
  crowdLink: { gap: space(2) },
  pressed: { opacity: 0.9 },
  crowdHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(1) },
  crowdHintText: { color: colors.textSecondary, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingHorizontal: space(3.5),
    paddingVertical: space(3),
  },
  errorText: { color: colors.warning, flex: 1 },
  cards: { gap: space(4) },
});
