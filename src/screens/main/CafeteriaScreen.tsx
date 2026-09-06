import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { RowSkeleton } from '../../components/Skeleton';
import { FadeIn } from '../../components/motion';
import { useAuth } from '../../context/AuthContext';
import { useSelectedDate } from '../../context/SelectedDateContext';
import { useCrowd } from '../../hooks/useCrowd';
import { useMeals } from '../../hooks/useMeals';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { CROWD_WINDOW_MS } from '../../services/crowd';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../../theme';
import type { CrowdReport } from '../../types';
import { formatKoreanDate, formatRelativeTime, toYmd } from '../../utils/date';

type Props = BottomTabScreenProps<MainTabParamList, 'Cafeteria'>;

export function CafeteriaScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const { profile, user, firebaseEnabled } = useAuth();
  const schoolKey = schoolKeyOf();
  const uid = profile?.uid ?? null;

  const { reports, summary, loading, error, now } = useCrowd(schoolKey, uid);

  // The rated day is the one the student picked over on 급식표, not the real
  // calendar day: paging to Thursday's menu and then reading a rating card
  // about Wednesday's lunch is the bug this shares state to avoid.
  const { date, today, isToday, currentService, ratedMealType, isRatable, goToToday } =
    useSelectedDate();
  const dateYmd = toYmd(date);
  const { meals } = useMeals(date);

  const { live, earlier } = useMemo(() => {
    const cutoff = now - CROWD_WINDOW_MS;
    return {
      live: reports.filter((report) => report.createdAt >= cutoff),
      earlier: reports.filter((report) => report.createdAt < cutoff),
    };
  }, [reports, now]);

  return (
    <Screen bloom={t.meal[ratedMealType].soft}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeIn index={0}>
          <View style={styles.header}>
            <Text style={[text.overline, styles.eyebrow]} numberOfLines={1}>
              {APP_SCHOOL.schoolName}
            </Text>
            <Text style={[text.hero, styles.title]}>급식실 현황</Text>
            <Text style={[text.body, styles.subtitle]}>
              줄 서는 시간과 급식 평가를 한눈에
            </Text>
          </View>
        </FadeIn>

        <FadeIn index={1}>
          <LunchLineLive />
        </FadeIn>

        <FadeIn index={2}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[text.overline, styles.sectionTitle]}>실시간 제보 기반 혼잡도</Text>
              <Pill label={`최근 ${Math.round(CROWD_WINDOW_MS / 60000)}분`} />
            </View>

            {loading ? (
              <View style={styles.loading}>
                <RowSkeleton />
                <RowSkeleton />
              </View>
            ) : (
              <CrowdMeter summary={summary} now={now} />
            )}
          </View>
        </FadeIn>

        {error ? <Text style={[text.caption, styles.error]}>{error}</Text> : null}

        {firebaseEnabled ? (
          <Button
            label={user ? '지금 상황 제보하기' : '로그인하고 제보하기'}
            onPress={() => (user ? navigation.navigate('CrowdReport') : navigation.navigate('SignIn'))}
            size="lg"
            fullWidth
            leading={<Ionicons name="megaphone" size={17} color={t.colors.onAccent} />}
          />
        ) : (
          <View style={styles.offlineNotice}>
            <Ionicons name="cloud-offline-outline" size={16} color={t.colors.textSecondary} />
            <Text style={[text.caption, styles.offlineText]}>
              실시간 제보는 서버 연결 후 열려요. 위의 예상 혼잡도는 지금도 볼 수 있어요.
            </Text>
          </View>
        )}

        {firebaseEnabled ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[text.overline, styles.sectionTitle]}>실시간 제보</Text>
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
                {live.map((report, index) => (
                  <FadeIn key={report.id} index={index} offset={10}>
                    <ReportRow
                      report={report}
                      now={now}
                      isMine={report.authorUid === profile?.uid}
                    />
                  </FadeIn>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {earlier.length > 0 ? (
          <View style={styles.section}>
            <Text style={[text.overline, styles.sectionTitle]}>지난 제보</Text>
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
          date={dateYmd}
          mealType={ratedMealType}
          meal={meals[ratedMealType]}
          profile={profile}
          dayLabel={isToday ? '오늘의' : formatKoreanDate(date)}
          ratable={isRatable}
          onGoToToday={isToday ? undefined : goToToday}
          onRequestSignIn={() => navigation.navigate('SignIn')}
        />

        <PastMealRatings schoolKey={schoolKey} today={today} mealType={currentService} uid={uid} />
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
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const step = t.crowdStep(report.level);
  const meal = t.meal[report.mealType];

  return (
    <View style={[styles.reportRow, t.shadow.xs, faded ? styles.reportFaded : null]}>
      {/* A colour stripe keyed to the reading, so a list of reports scans as a
          trend rather than as a wall of text. */}
      <View style={[styles.reportStripe, { backgroundColor: step.color }]} />

      <Avatar
        emoji={report.authorEmoji}
        photoUrl={report.authorPhotoUrl}
        size={40}
        ringColor={step.color}
      />

      <View style={styles.reportBody}>
        <View style={styles.reportTop}>
          <Text style={[text.bodyStrong, styles.reportName]} numberOfLines={1}>
            {isMine ? '나' : report.authorName}
          </Text>
          <Pill label={step.label} color={step.color} background={step.soft} />
          <Pill label={meal.label} color={meal.tint} background={meal.soft} />
        </View>

        {report.note ? (
          <Text style={[text.body, styles.reportNote]} numberOfLines={2}>
            {report.note}
          </Text>
        ) : null}

        <Text style={[text.caption, styles.reportMeta]}>
          {report.waitMinutes > 0 ? `대기 약 ${report.waitMinutes}분 · ` : ''}
          {formatRelativeTime(report.createdAt, now)}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    content: { padding: space(5), paddingBottom: space(30), gap: space(5) },
    header: { gap: space(1.5) },
    eyebrow: { color: t.colors.brand },
    title: { color: t.colors.text },
    subtitle: { color: t.colors.textSecondary },
    loading: { gap: space(2) },
    error: { color: t.colors.danger },
    section: { gap: space(3) },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
    sectionTitle: { color: t.colors.textSecondary },
    reportList: { gap: space(2.5) },
    reportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      backgroundColor: t.colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: space(4),
      paddingLeft: space(4.5),
      overflow: 'hidden',
    },
    reportStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    reportFaded: { opacity: 0.55 },
    reportBody: { flex: 1, gap: space(1.5) },
    reportTop: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
    reportName: { color: t.colors.text },
    reportNote: { color: t.colors.text },
    reportMeta: { color: t.colors.textMuted },
    offlineNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(2),
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.md,
      paddingHorizontal: space(4),
      paddingVertical: space(3.5),
    },
    offlineText: { color: t.colors.textSecondary, flex: 1 },
  });
