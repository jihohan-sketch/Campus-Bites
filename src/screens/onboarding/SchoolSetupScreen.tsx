import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { MadeBy } from '../../components/MadeBy';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { APP_SCHOOL, APP_SCHOOL_EN } from '../../config/school';
import { describeAuthError } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { updateProfile } from '../../services/profile';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolSetup'>;

/**
 * Grade and class setup. The school itself is fixed for this app, so this
 * screen only collects where in the school the student is.
 */
export function SchoolSetupScreen({ navigation, route }: Props) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { mode } = route.params;
  const { profile } = useAuth();

  const [grade, setGrade] = useState(profile?.grade ? String(profile.grade) : '');
  const [classNo, setClassNo] = useState(profile?.classNo ? String(profile.classNo) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Main');
  };

  const handleSave = async () => {
    if (!profile) {
      close();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile(profile.uid, {
        grade: parseOptionalInt(grade),
        classNo: parseOptionalInt(classNo),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      close();
    } catch (saveError) {
      setError(describeAuthError(saveError));
      setSaving(false);
    }
  };

  return (
    <Screen topInset={mode === 'onboarding'}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[text.title, styles.title]}>
              {mode === 'onboarding' ? '어느 반이신가요?' : '학년 · 반 변경'}
            </Text>
            <Text style={[text.body, styles.subtitle]}>
              친구들이 알아보기 쉬워져요. 나중에 언제든 바꿀 수 있어요.
            </Text>
          </View>

          <Card style={styles.schoolCard}>
            <Text style={styles.schoolEmoji}>🏫</Text>
            <View style={styles.schoolText}>
              <Text style={[text.bodyStrong, styles.schoolName]}>{APP_SCHOOL.schoolName}</Text>
              <Text style={[text.caption, styles.schoolMeta]}>
                {APP_SCHOOL_EN} · {APP_SCHOOL.region}
              </Text>
            </View>
          </Card>

          <View style={styles.classRow}>
            <TextField
              label="학년"
              value={grade}
              onChangeText={setGrade}
              placeholder="선택"
              keyboardType="number-pad"
              maxLength={2}
              containerStyle={styles.classField}
            />
            <TextField
              label="반"
              value={classNo}
              onChangeText={setClassNo}
              placeholder="선택"
              keyboardType="number-pad"
              maxLength={2}
              containerStyle={styles.classField}
            />
          </View>

          {error ? <Text style={[text.caption, styles.error]}>{error}</Text> : null}

          <Button
            label={mode === 'onboarding' ? '시작하기' : '저장하기'}
            onPress={handleSave}
            loading={saving}
            size="lg"
            fullWidth
          />

          {mode === 'onboarding' ? (
            <Button label="나중에 하기" variant="ghost" onPress={close} fullWidth />
          ) : null}

          <MadeBy />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

/** Returns a positive integer, or `null` for empty / invalid input. */
function parseOptionalInt(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: space(5), gap: space(5), flexGrow: 1, justifyContent: 'center' },
    header: { gap: space(2) },
    title: { color: t.colors.text },
    subtitle: { color: t.colors.textSecondary },
    schoolCard: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    schoolEmoji: { fontSize: 28 },
    schoolText: { flex: 1, gap: space(0.5) },
    schoolName: { color: t.colors.text },
    schoolMeta: { color: t.colors.textMuted },
    classRow: { flexDirection: 'row', gap: space(3) },
    classField: { flex: 1 },
    error: { color: t.colors.danger },
  });
