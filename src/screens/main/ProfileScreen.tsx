import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { Screen } from '../../components/Screen';
import { APP_SCHOOL, APP_SCHOOL_EN } from '../../config/school';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../hooks/useFriends';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { formatClassLabel } from '../../services/profile';
import { colors, radius, space, type } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export function ProfileScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.guestHeader}>
            <Text style={styles.guestEmoji}>🍱</Text>
            <Text style={[type.title, styles.name]}>VIS 급식</Text>
            <Text style={[type.body, styles.guestSubtitle]}>
              {APP_SCHOOL.schoolName} · {APP_SCHOOL_EN}
            </Text>
          </View>

          <Card padded={false}>
            <Row icon="restaurant-outline" label="급식표" value="바로 보기" onPress={() => navigation.navigate('Main', { screen: 'Meals' })} />
            <Row
              icon="people-outline"
              label="급식실 혼잡도"
              value="둘러보기"
              onPress={() => navigation.navigate('Main', { screen: 'Cafeteria' })}
              divided
            />
          </Card>

          <View style={styles.guestCta}>
            <Text style={[type.body, styles.guestCtaText]}>
              로그인하면 혼잡도 제보, 친구 추가, 레이더를 쓸 수 있어요.
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

          {!firebaseEnabled ? (
            <Text style={[type.caption, styles.aboutText]}>
              소셜 기능은 서버 연결 후 사용할 수 있어요. 급식표는 지금 바로 볼 수 있습니다.
            </Text>
          ) : null}
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar emoji={profile?.emoji ?? '🍚'} size={72} background={colors.brandSoft} />
          <View style={styles.headerText}>
            <Text style={[type.title, styles.name]} numberOfLines={1}>
              {profile?.displayName ?? '학생'}
            </Text>
            <Text style={[type.caption, styles.email]} numberOfLines={1}>
              {profile?.email ?? ''}
            </Text>
            {classLabel ? <Pill label={classLabel} style={styles.classPill} /> : null}
          </View>
        </View>

        <Button
          label="프로필 수정"
          variant="secondary"
          onPress={() => navigation.navigate('EditProfile')}
          fullWidth
          leading={<Ionicons name="create-outline" size={16} color={colors.text} />}
        />

        {profileError ? (
          <Text style={[type.caption, styles.error]}>{profileError}</Text>
        ) : null}

        <Card padded={false}>
          <Row icon="school-outline" label="학교" value={APP_SCHOOL.schoolName} onPress={() => {}} />
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

        <Card padded={false}>
          <Row
            icon="megaphone-outline"
            label="급식실 혼잡도 제보"
            value="바로 제보"
            onPress={() => navigation.navigate('CrowdReport')}
          />
          <Row
            icon="radio-outline"
            label="친구 레이더"
            value="상태 변경"
            onPress={() => navigation.navigate('Main', { screen: 'Radar' })}
            divided
          />
        </Card>

        <View style={styles.about}>
          <Text style={[type.label, styles.aboutTitle]}>급식 정보</Text>
          <Text style={[type.caption, styles.aboutText]}>
            VIS 식단표에서 가져옵니다. 매달 새 메뉴가 나오면 앱도 업데이트돼요.
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        divided ? styles.rowDivided : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
      </View>
      <Text style={[type.body, styles.rowLabel]}>{label}</Text>
      <Text style={[type.caption, styles.rowValue]} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), paddingBottom: space(10), gap: space(4) },
  guestHeader: { alignItems: 'center', gap: space(2), paddingVertical: space(4) },
  guestEmoji: { fontSize: 52 },
  guestSubtitle: { color: colors.textSecondary, textAlign: 'center' },
  guestCta: { gap: space(3), marginTop: space(2) },
  guestCtaText: { color: colors.textSecondary, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space(4) },
  headerText: { flex: 1, gap: space(1) },
  name: { color: colors.text },
  email: { color: colors.textMuted },
  classPill: { alignSelf: 'flex-start', marginTop: space(1) },
  error: { color: colors.danger },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    paddingHorizontal: space(4),
    paddingVertical: space(4),
  },
  rowDivided: { borderTopWidth: 1, borderTopColor: colors.border },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: colors.text, flex: 1 },
  rowValue: { color: colors.textSecondary, maxWidth: 150, textAlign: 'right' },
  about: {
    gap: space(1.5),
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: space(4),
  },
  aboutTitle: { color: colors.textSecondary },
  aboutText: { color: colors.textMuted },
});
