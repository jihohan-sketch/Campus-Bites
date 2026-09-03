import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APP_SCHOOL, schoolKeyOf } from '../../config/school';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { CrowdMeter } from '../../components/CrowdMeter';
import { EmptyState } from '../../components/EmptyState';
import { LunchLineLive } from '../../components/LunchLineLive';
import { MealRatingPanel } from '../../components/MealRatingPanel';
import { PastMealRatings } from '../../components/PastMealRatings';
import { Pill } from '../../components/Pill';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { useCrowd } from '../../hooks/useCrowd';
import { useMeals } from '../../hooks/useMeals';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { CROWD_WINDOW_MS } from '../../services/crowd';
import { colors, crowdStepFor, mealTheme, radius, shadow, space, type } from '../../theme';
import type { CrowdReport } from '../../types';
import { currentHourInKst, formatRelativeTime, todayInKst, toYmd } from '../../utils/date';
import { currentMealType } from '../../utils/meal';

type Props = BottomTabScreenProps<MainTabParamList, 'Cafeteria'>;

export function CafeteriaScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, user } = useAuth();
  const schoolKey = schoolKeyOf();

  const { reports, summary, loading, error, now } = useCrowd(schoolKey);

  const today = useMemo(() => todayInKst(), []);
  const todayYmd = toYmd(today);
  // Rate whichever service is happening around now, not always lunch.
  const ratedMealType = useMemo(() => currentMealType(currentHourInKst()), []);
  const { meals } = useMeals(today);

  const { live, earlier } = useMemo(() => {
    const cutoff = now - CROWD_WINDOW_MS;
    return {
      live: reports.filter((report) => report.createdAt >= cutoff),
      earlier: reports.filter((report) => report.createdAt < cutoff),
    };
  }, [reports, now]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[type.caption, styles.eyebrow]} numberOfLines={1}>
            {APP_SCHOOL.schoolName}
          </Text>
          <Text style={[type.display, styles.title]}>급식실 현황</Text>
          <Text style={[type.caption, styles.subtitle]}>
            줄 서는 시간과 오늘 급식 평가를 한눈에
          </Text>
        </View>

        <LunchLineLive />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[type.label, styles.sectionTitle]}>실시간 제보 기반 혼잡도</Text>
            <Pill label={`최근 ${Math.round(CROWD_WINDOW_MS / 60000)}분`} />
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : (
            <CrowdMeter summary={summary} now={now} />
          )}
        </View>

        {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}

        <Button
          label={user ? '지금 상황 제보하기' : '로그인하고 제보하기'}
          onPress={() =>
            user ? navigation.navigate('CrowdReport') : navigation.navigate('SignIn')
          }
          size="lg"
          fullWidth
          leading={<Ionicons name="megaphone-outline" size={18} color={colors.white} />}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[type.label, styles.sectionTitle]}>실시간 제보</Text>
            <Pill label={`${live.length}건`} />
          </View>

          {live.length === 0 ? (
            <EmptyState
              emoji="📣"
              title="아직 제보가 없어요"
              description="줄이 얼마나 긴지 알려 주면 친구들이 시간을 아낄 수 있어요."
            />
          ) : (
            <View style={styles.reportList}>
              {live.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  now={now}
                  isMine={report.authorUid === profile?.uid}
                />
              ))}
            </View>
          )}
        </View>

        {earlier.length > 0 ? (
          <View style={styles.section}>
            <Text style={[type.label, styles.sectionTitle]}>지난 제보</Text>
            <View style={styles.reportList}>
              {earlier.slice(0, 20).map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  now={now}
                  isMine={report.authorUid === profile?.uid}
                  faded
                />
              ))}
            </View>
          </View>
        ) : null}

        <MealRatingPanel
          schoolKey={schoolKey}
          date={todayYmd}
          mealType={ratedMealType}
          meal={meals[ratedMealType]}
          profile={profile}
        />

        <PastMealRatings schoolKey={schoolKey} today={today} mealType={ratedMealType} />
      </ScrollView>
    </Screen>
  );
}

function ReportRow({
  report,
  now,
  isMine,
  faded = false,
}: {
  report: CrowdReport;
  now: number;
  isMine: boolean;
  faded?: boolean;
}) {
  const step = crowdStepFor(report.level);
  const meal = mealTheme[report.mealType];

  return (
    <View style={[styles.reportRow, shadow.sm, faded ? styles.reportFaded : null]}>
      <Avatar emoji={report.authorEmoji} size={40} ringColor={step.color} />

      <View style={styles.reportBody}>
        <View style={styles.reportTop}>
          <Text style={[type.bodyStrong, styles.reportName]} numberOfLines={1}>
            {isMine ? '나' : report.authorName}
          </Text>
          <Pill label={step.label} color={step.color} background={step.soft} />
          <Pill label={meal.label} color={meal.tint} background={meal.soft} />
        </View>

        {report.note ? (
          <Text style={[type.body, styles.reportNote]} numberOfLines={2}>
            {report.note}
          </Text>
        ) : null}

        <Text style={[type.caption, styles.reportMeta]}>
          {report.waitMinutes > 0 ? `대기 약 ${report.waitMinutes}분 · ` : ''}
          {formatRelativeTime(report.createdAt, now)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), paddingBottom: space(10), gap: space(5) },
  header: { gap: space(1) },
  eyebrow: { color: colors.brand, fontWeight: '700', letterSpacing: 0.4 },
  title: { color: colors.text },
  subtitle: { color: colors.textSecondary },
  loading: { paddingVertical: space(12), alignItems: 'center' },
  error: { color: colors.danger },
  section: { gap: space(3) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  sectionTitle: { color: colors.textSecondary },
  reportList: { gap: space(2.5) },
  reportRow: {
    flexDirection: 'row',
    gap: space(3),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space(4),
  },
  reportFaded: { opacity: 0.62 },
  reportBody: { flex: 1, gap: space(1.5) },
  reportTop: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  reportName: { color: colors.text },
  reportNote: { color: colors.text },
  reportMeta: { color: colors.textMuted },
});
