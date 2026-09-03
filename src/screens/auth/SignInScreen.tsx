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
import { describeAuthError } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { colors, space, type } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

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
            <Text style={[type.display, styles.title]}>VIS 급식</Text>
            <Text style={[type.body, styles.subtitle]}>
              오늘 급식, 급식실 혼잡도, 친구 레이더를 한눈에.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="student@school.kr"
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
              <Text style={[type.body, styles.switchText]}>계정이 없나요? </Text>
              <Text style={[type.bodyStrong, styles.switchLink]}>가입하기</Text>
            </Pressable>

            {navigation.canGoBack() ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.goBack()}
                style={styles.switchRow}
              >
                <Text style={[type.body, styles.switchText]}>로그인 없이 </Text>
                <Text style={[type.bodyStrong, styles.switchLink]}>둘러보기</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: space(6), justifyContent: 'center', gap: space(8) },
  hero: { gap: space(2) },
  emoji: { fontSize: 52 },
  title: { color: colors.text },
  subtitle: { color: colors.textSecondary },
  form: { gap: space(4) },
  submit: { marginTop: space(2) },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: space(2) },
  switchText: { color: colors.textSecondary },
  switchLink: { color: colors.brand },
});
