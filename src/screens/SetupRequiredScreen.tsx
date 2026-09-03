import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { MISSING_FIREBASE_ENV_NAMES, type FirebaseConfig } from '../config/env';
import { colors, radius, space, type } from '../theme';

interface SetupRequiredScreenProps {
  missingKeys: string[];
}

const STEPS = [
  'console.firebase.google.com 에서 프로젝트를 만들고 웹 앱을 추가합니다.',
  'Authentication → Sign-in method 에서 “이메일/비밀번호”를 사용 설정합니다.',
  'Firestore Database 를 만들고 저장소의 firestore.rules · firestore.indexes.json 을 배포합니다.',
  '프로젝트 루트의 .env 파일에 아래 값을 채운 뒤 개발 서버를 다시 시작합니다.',
];

/**
 * Rendered instead of the app when the build has no Firebase credentials, so a
 * misconfigured checkout explains itself rather than crashing.
 */
export function SetupRequiredScreen({ missingKeys }: SetupRequiredScreenProps) {
  const missingEnvNames = missingKeys.map(
    (key) => MISSING_FIREBASE_ENV_NAMES[key as keyof FirebaseConfig] ?? key,
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Ionicons name="construct-outline" size={22} color={colors.warning} />
        </View>

        <Text style={[type.title, styles.title]}>Firebase 설정이 필요해요</Text>
        <Text style={[type.body, styles.subtitle]}>
          급식 정보는 설정 없이도 불러오지만, 로그인 · 혼잡도 제보 · 친구 레이더는 Firebase
          프로젝트에 연결해야 동작합니다.
        </Text>

        <Card style={styles.card}>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepIndex}>
                <Text style={[type.caption, styles.stepIndexText]}>{index + 1}</Text>
              </View>
              <Text style={[type.body, styles.stepText]}>{step}</Text>
            </View>
          ))}
        </Card>

        <Text style={[type.label, styles.sectionLabel]}>비어 있는 값</Text>
        <Card style={styles.card} variant="flat">
          {missingEnvNames.map((name) => (
            <Text key={name} style={[type.body, styles.envName]}>
              {name}=
            </Text>
          ))}
        </Card>

        <Text style={[type.caption, styles.footnote]}>
          .env.example 파일에 전체 변수 목록이 들어 있습니다.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), gap: space(3), paddingBottom: space(12) },
  badge: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.text, marginTop: space(1) },
  subtitle: { color: colors.textSecondary },
  card: { gap: space(3), marginTop: space(2) },
  step: { flexDirection: 'row', gap: space(3), alignItems: 'flex-start' },
  stepIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: { color: colors.textSecondary, fontWeight: '700' },
  stepText: { flex: 1, color: colors.text },
  sectionLabel: { color: colors.textSecondary, marginTop: space(3) },
  envName: { color: colors.text },
  footnote: { color: colors.textMuted, marginTop: space(2) },
});
