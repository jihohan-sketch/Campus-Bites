import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
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
import { describeAuthError } from '../../config/firebase';
import { APP_SCHOOL_EMAIL_DOMAIN, isSchoolEmail } from '../../config/school';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { user, signUp, signInWithGoogle, googleAvailable } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const busy = submitting || googleBusy;

  // The navigator does not branch on auth state: 급식표 is guest-first and this
  // screen is a modal over it, so a successful sign-in changes nothing on its
  // own. Without this the spinner keeps turning on a session that is already
  // signed in, which reads as a hung app.
  useEffect(() => {
    if (!user) return;
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main', { screen: 'Meals' });
  }, [user, navigation]);
  const passwordTooShort = password.length > 0 && password.length < 6;
  // Flag the wrong domain while they type rather than after they hit 가입하기.
  const wrongDomain = email.trim().length > 0 && !isSchoolEmail(email);
  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    !wrongDomain &&
    password.length >= 6 &&
    !busy;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUp(displayName, email, password);
    } catch (signUpError) {
      setError(describeAuthError(signUpError));
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setGoogleBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (googleError) {
      setError(describeAuthError(googleError));
      setGoogleBusy(false);
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
            <Text style={[text.display, styles.title]}>가입하기</Text>
            <Text style={[text.body, styles.subtitle]}>
              {`친구들이 알아볼 이름과 학교 이메일(@${APP_SCHOOL_EMAIL_DOMAIN})이면 충분해요.`}
            </Text>
          </View>

          <View style={styles.form}>
            {googleAvailable ? (
              <>
                <Button
                  label="학교 구글 계정으로 가입하기"
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
              label="이름"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="한지호"
              autoCapitalize="words"
              maxLength={20}
              returnKeyType="next"
            />
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
              hint={`학교 계정(@${APP_SCHOOL_EMAIL_DOMAIN})만 가입할 수 있어요`}
              error={wrongDomain ? `@${APP_SCHOOL_EMAIL_DOMAIN} 주소를 입력해 주세요.` : null}
            />
            <TextField
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="6자 이상"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              hint="6자 이상 입력해 주세요"
              error={error ?? (passwordTooShort ? '비밀번호는 6자 이상이어야 해요.' : null)}
            />

            <Button
              label="가입하고 시작하기"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
              size="lg"
              fullWidth
              style={styles.submit}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={styles.switchRow}
            >
              <Text style={[text.body, styles.switchText]}>이미 계정이 있나요? </Text>
              <Text style={[text.bodyStrong, styles.switchLink]}>로그인</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { flexGrow: 1, padding: space(6), justifyContent: 'center', gap: space(7) },
    hero: { gap: space(2) },
    title: { color: t.colors.text },
    subtitle: { color: t.colors.textSecondary },
    form: { gap: space(4) },
    submit: { marginTop: space(2) },
    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: space(2) },
    switchText: { color: t.colors.textSecondary },
    switchLink: { color: t.colors.brand },
    divider: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    dividerLine: { flex: 1, height: 1, backgroundColor: t.colors.border },
    dividerText: { color: t.colors.textMuted },
  });
