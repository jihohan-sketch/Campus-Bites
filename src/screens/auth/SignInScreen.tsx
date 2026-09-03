import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { APP_NAME, APP_SCHOOL_EMAIL_DOMAIN } from '../../config/school';
import { describeAuthError } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { signIn, signInWithGoogle, firebaseEnabled, googleAvailable } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const busy = submitting || googleBusy;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  const handleGoogle = async () => {
    if (busy) return;
    setGoogleBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      // On success the auth state swaps the navigator out from under us.
    } catch (googleError) {
      setError(describeAuthError(googleError));
      setGoogleBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      // Navigation is driven by the auth state, so nothing to do on success.
    } catch (signInError) {
      setError(describeAuthError(signInError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.emoji}>🍱</Text>
            <Text style={[text.display, styles.title]}>{APP_NAME}</Text>
            <Text style={[text.body, styles.subtitle]}>
              오늘 급식과 급식실 혼잡도를 한눈에.
            </Text>
          </View>

          {/* Reached directly by a deep link or a stale screen: say so up front
              rather than after the student has filled the whole form in. */}
          {!firebaseEnabled ? (
            <View style={styles.notice}>
              <Text style={[text.bodyStrong, styles.noticeTitle]}>
                로그인은 아직 준비 중이에요
              </Text>
              <Text style={[text.caption, styles.noticeText]}>
                서버가 연결되면 계정을 만들 수 있어요. 급식표와 급식 평가는 로그인 없이도
                바로 쓸 수 있습니다.
              </Text>
              <Button
                label="급식표 보러 가기"
                variant="secondary"
                onPress={() => navigation.navigate('Main', { screen: 'Meals' })}
                fullWidth
                style={styles.submit}
              />
            </View>
          ) : (
          <View style={styles.form}>
            {googleAvailable ? (
              <>
                <Button
                  label="학교 구글 계정으로 계속하기"
                  variant="secondary"
                  onPress={handleGoogle}
                  loading={googleBusy}
                  disabled={busy}
                  size="lg"
                  fullWidth
                  leading={<Ionicons name="logo-google" size={18} color={t.colors.text} />}
                />
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={[text.caption, styles.dividerText]}>또는 이메일로</Text>
                  <View style={styles.dividerLine} />
                </View>
              </>
            ) : null}

            <TextField
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder={`student@${APP_SCHOOL_EMAIL_DOMAIN}`}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <TextField
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="6자 이상"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              error={error}
            />

            <Button
              label="로그인"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
              size="lg"
              fullWidth
              style={styles.submit}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.switchRow}
            >
              <Text style={[text.body, styles.switchText]}>계정이 없나요? </Text>
              <Text style={[text.bodyStrong, styles.switchLink]}>가입하기</Text>
            </Pressable>

            {navigation.canGoBack() ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.goBack()}
                style={styles.switchRow}
              >
                <Text style={[text.body, styles.switchText]}>로그인 없이 </Text>
                <Text style={[text.bodyStrong, styles.switchLink]}>둘러보기</Text>
              </Pressable>
            ) : null}
          </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { flexGrow: 1, padding: space(6), justifyContent: 'center', gap: space(8) },
    hero: { gap: space(2) },
    emoji: { fontSize: 52 },
    title: { color: t.colors.text },
    subtitle: { color: t.colors.textSecondary },
    form: { gap: space(4) },
    submit: { marginTop: space(2) },
    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: space(2) },
    switchText: { color: t.colors.textSecondary },
    switchLink: { color: t.colors.brand },
    notice: {
      gap: space(2),
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.lg,
      padding: space(5),
    },
    noticeTitle: { color: t.colors.text },
    noticeText: { color: t.colors.textSecondary },
    divider: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    dividerLine: { flex: 1, height: 1, backgroundColor: t.colors.border },
    dividerText: { color: t.colors.textMuted },
  });
