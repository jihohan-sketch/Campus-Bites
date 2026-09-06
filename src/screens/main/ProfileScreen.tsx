import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { Screen } from '../../components/Screen';
import { FadeIn, PressableScale } from '../../components/motion';
import { APP_NAME, APP_SCHOOL, APP_SCHOOL_EN } from '../../config/school';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../hooks/useFriends';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { formatClassLabel } from '../../services/profile';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export function ProfileScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const { user, profile, signOut, profileError, firebaseEnabled } = useAuth();
  const { friends, incoming } = useFriends(profile?.uid ?? null);

  const confirmSignOut = () => {
    Alert.alert('로그아웃', '이 기기에서 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const classLabel = profile ? formatClassLabel(profile) : '';

  if (!user) {
    return (
      <Screen bloom={t.colors.brandSoft}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeIn index={0}>
            <View style={styles.guestHeader}>
              <View style={styles.guestBadge}>
                <Text style={styles.guestEmoji}>🍱</Text>
              </View>
              <Text style={[text.title, styles.name]}>{APP_NAME}</Text>
              <Text style={[text.body, styles.guestSubtitle]}>
                {APP_SCHOOL.schoolName} · {APP_SCHOOL_EN}
              </Text>
            </View>
          </FadeIn>

          <FadeIn index={1}>
            <Card padded={false}>
              <Row
                icon="restaurant-outline"
                label="급식표"
                value="바로 보기"
                onPress={() => navigation.navigate('Main', { screen: 'Meals' })}
              />
              <Row
                icon="people-outline"
                label="급식실 혼잡도"
                value="둘러보기"
                onPress={() => navigation.navigate('Main', { screen: 'Cafeteria' })}
                divided
              />
            </Card>
          </FadeIn>

          {firebaseEnabled ? (
            <FadeIn index={2}>
              <View style={styles.guestCta}>
                <Text style={[text.body, styles.guestCtaText]}>
                  로그인하면 혼잡도 제보와 친구 추가를 쓸 수 있어요.
                </Text>
                <Button
                  label="로그인"
                  onPress={() => navigation.navigate('SignIn')}
                  size="lg"
                  fullWidth
                />
                <Button
                  label="가입하기"
                  variant="secondary"
                  onPress={() => navigation.navigate('SignUp')}
                  size="lg"
                  fullWidth
                />
              </View>
            </FadeIn>
          ) : (
            // No backend means no account to sign into. Showing the buttons
            // anyway just walks a student into a form that cannot succeed.
            <View style={styles.about}>
              <Text style={[text.overline, styles.aboutTitle]}>준비 중인 기능</Text>
              <Text style={[text.caption, styles.aboutText]}>
                혼잡도 제보와 친구 기능은 서버 연결 후 열려요. 급식표와 예상 혼잡도, 급식
                평가는 지금 바로 쓸 수 있어요.
              </Text>
            </View>
          )}
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen bloom={t.colors.brandSoft}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeIn index={0}>
          <View style={styles.header}>
            <Avatar
              emoji={profile?.emoji ?? '🍚'}
              photoUrl={profile?.photoUrl}
              size={76}
              background={t.colors.brandSoft}
              ringColor={t.colors.brand}
            />
            <View style={styles.headerText}>
              <Text style={[text.title, styles.name]} numberOfLines={1}>
                {profile?.displayName ?? '학생'}
              </Text>
              <Text style={[text.caption, styles.email]} numberOfLines={1}>
                {profile?.email ?? ''}
              </Text>
              {classLabel ? (
                <Pill
                  label={classLabel}
                  color={t.colors.brand}
                  background={t.colors.brandSoft}
                  style={styles.classPill}
                />
              ) : null}
            </View>
          </View>
        </FadeIn>

        <Button
          label="프로필 수정"
          variant="secondary"
          onPress={() => navigation.navigate('EditProfile')}
          fullWidth
          leading={<Ionicons name="create-outline" size={16} color={t.colors.text} />}
        />

        {profileError ? <Text style={[text.caption, styles.error]}>{profileError}</Text> : null}

        <FadeIn index={1}>
          <Card padded={false}>
            <Row
              icon="school-outline"
              label="학교"
              value={APP_SCHOOL.schoolName}
              onPress={() => {}}
            />
            <Row
              icon="people-outline"
              label="친구"
              value={
                incoming.length > 0
                  ? `${friends.length}명 · 요청 ${incoming.length}건`
                  : `${friends.length}명`
              }
              onPress={() => navigation.navigate('AddFriend')}
              divided
            />
            <Row
              icon="key-outline"
              label="내 친구 코드"
              value={profile?.friendCode ?? '—'}
              onPress={() => navigation.navigate('AddFriend')}
              divided
            />
          </Card>
        </FadeIn>

        <FadeIn index={2}>
          <Card padded={false}>
            <Row
              icon="megaphone-outline"
              label="급식실 혼잡도 제보"
              value="바로 제보"
              onPress={() => navigation.navigate('CrowdReport')}
            />
          </Card>
        </FadeIn>

        <View style={styles.about}>
          <Text style={[text.overline, styles.aboutTitle]}>급식 정보</Text>
          <Text style={[text.caption, styles.aboutText]}>
            {APP_SCHOOL.schoolName} 식단표를 그대로 옮겨 싣습니다. 새 식단표가 등록되면 앱을
            업데이트하지 않아도 바로 반영돼요.
          </Text>
        </View>

        <Button label="로그아웃" variant="danger" onPress={confirmSignOut} fullWidth />
      </ScrollView>
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  divided = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
  divided?: boolean;
}) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      scaleTo={0.99}
      dim
      style={[styles.row, divided ? styles.rowDivided : null]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={17} color={t.colors.brand} />
      </View>
      <Text style={[text.body, styles.rowLabel]}>{label}</Text>
      <Text style={[text.caption, styles.rowValue]} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={t.colors.textMuted} />
    </PressableScale>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    content: { padding: space(5), paddingBottom: space(30), gap: space(4) },

    guestHeader: { alignItems: 'center', gap: space(2), paddingVertical: space(5) },
    guestBadge: {
      width: 96,
      height: 96,
      borderRadius: radius.xxl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.brandSoft,
      marginBottom: space(2),
    },
    guestEmoji: { fontSize: 46 },
    guestSubtitle: { color: t.colors.textSecondary, textAlign: 'center' },
    guestCta: { gap: space(3), marginTop: space(2) },
    guestCtaText: { color: t.colors.textSecondary, textAlign: 'center' },

    header: { flexDirection: 'row', alignItems: 'center', gap: space(4) },
    headerText: { flex: 1, gap: space(1) },
    name: { color: t.colors.text },
    email: { color: t.colors.textMuted },
    classPill: { alignSelf: 'flex-start', marginTop: space(1) },
    error: { color: t.colors.danger },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      paddingHorizontal: space(4.5),
      paddingVertical: space(4),
    },
    rowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.divider },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.xs,
      backgroundColor: t.colors.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: { color: t.colors.text, flex: 1 },
    rowValue: { color: t.colors.textSecondary, maxWidth: 150, textAlign: 'right' },

    about: {
      gap: space(1.5),
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.xl,
      padding: space(4.5),
    },
    aboutTitle: { color: t.colors.textSecondary },
    aboutText: { color: t.colors.textMuted },
  });
