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

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 6;
  const canSubmit =
    displayName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    !submitting;

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
            <Text style={[type.display, styles.title]}>가입하기</Text>
            <Text style={[type.body, styles.subtitle]}>
              친구들이 알아볼 이름과 학교 이메일이면 충분해요.
            </Text>
          </View>

          <View style={styles.form}>
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
              <Text style={[type.body, styles.switchText]}>이미 계정이 있나요? </Text>
              <Text style={[type.bodyStrong, styles.switchLink]}>로그인</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: space(6), justifyContent: 'center', gap: space(7) },
  hero: { gap: space(2) },
  title: { color: colors.text },
  subtitle: { color: colors.textSecondary },
  form: { gap: space(4) },
  submit: { marginTop: space(2) },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: space(2) },
  switchText: { color: colors.textSecondary },
  switchLink: { color: colors.brand },
});
