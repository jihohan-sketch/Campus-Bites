import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { schoolKeyOf } from '../../config/school';
import { AuthPrompt } from '../../components/AuthPrompt';
import { Button } from '../../components/Button';
import { CrowdLevelPicker } from '../../components/CrowdLevelPicker';
import { MadeBy } from '../../components/MadeBy';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TextField } from '../../components/TextField';
import { Pulse, PressableScale } from '../../components/motion';
import { describeAuthError } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { submitCrowdReport } from '../../services/crowd';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../../theme';
import { MEAL_TYPES, type CrowdLevel, type MealType } from '../../types';
import { currentHourInKst } from '../../utils/date';
import { currentMealType } from '../../utils/meal';

type Props = NativeStackScreenProps<RootStackParamList, 'CrowdReport'>;

/** Preset queue lengths, so most reports are two taps. */
const WAIT_PRESETS = [0, 3, 5, 10, 15, 20];

export function CrowdReportScreen({ navigation }: Props) {
  const { profile, user } = useAuth();

  if (!user || !profile) {
    return <AuthPrompt title="제보하려면 로그인해 주세요" />;
  }

  return <CrowdReportForm navigation={navigation} profile={profile} />;
}

function CrowdReportForm({
  navigation,
  profile,
}: {
  navigation: Props['navigation'];
  profile: NonNullable<ReturnType<typeof useAuth>['profile']>;
}) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const [level, setLevel] = useState<CrowdLevel>(3);
  const [mealType, setMealType] = useState<MealType>(() => currentMealType(currentHourInKst()));
  const [waitMinutes, setWaitMinutes] = useState(5);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = t.crowdStep(level);
  const mealOptions = useMemo(
    () => MEAL_TYPES.map((value) => ({ value, label: t.meal[value].label })),
    [t],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitCrowdReport(profile, schoolKeyOf(), { level, waitMinutes, note, mealType });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (submitError) {
      setError(describeAuthError(submitError));
      setSubmitting(false);
    }
  };

  return (
    <Screen topInset={false} bloom={step.soft}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* The preview restates the reading the student is about to file, in
              its own colour, so a mis-tap is obvious before they send it. */}
          <View style={[styles.preview, { backgroundColor: step.soft, borderColor: step.color }]}>
            <Pulse active={level >= 5} duration={780} scaleTo={1.5} minOpacity={0.3}>
              <View style={[styles.previewDot, { backgroundColor: step.color }]} />
            </Pulse>
            <Text style={[text.display, { color: step.color }]}>{step.label}</Text>
            <Text style={[text.body, styles.previewDetail]}>{step.detail}</Text>
          </View>

          <Field label="지금 급식실은 어떤가요?">
            <CrowdLevelPicker value={level} onChange={setLevel} />
          </Field>

          <Field label="어떤 식사인가요?">
            <SegmentedControl options={mealOptions} value={mealType} onChange={setMealType} />
          </Field>

          <Field label="대기 시간">
            <View style={styles.presets}>
              {WAIT_PRESETS.map((preset) => {
                const selected = preset === waitMinutes;
                return (
                  <PressableScale
                    key={preset}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    scaleTo={0.92}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setWaitMinutes(preset);
                    }}
                    style={[
                      styles.preset,
                      selected
                        ? { backgroundColor: step.color, borderColor: step.color }
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        text.label,
                        { color: selected ? t.colors.onAccent : t.colors.textSecondary },
                      ]}
                    >
                      {preset === 0 ? '바로' : `${preset}분`}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </Field>

          <TextField
            label="한 마디 (선택)"
            value={note}
            onChangeText={setNote}
            placeholder="예: 배식대 두 줄 다 열렸어요"
            maxLength={120}
            multiline
            containerStyle={styles.note}
            hint={`${note.length}/120`}
            error={error}
          />

          <Button
            label="제보 보내기"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            fullWidth
            tint={step.color}
          />

          <Text style={[text.caption, styles.disclaimer]}>
            제보에는 이름과 이모지가 함께 표시되고, 같은 학교 학생만 볼 수 있어요.
          </Text>

          <MadeBy />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.field}>
      <Text style={[text.overline, styles.fieldLabel]}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: space(5), paddingBottom: space(12), gap: space(6) },
    preview: {
      borderRadius: radius.xl,
      padding: space(6),
      alignItems: 'center',
      gap: space(1.5),
      borderWidth: StyleSheet.hairlineWidth,
    },
    previewDot: { width: 12, height: 12, borderRadius: 6, marginBottom: space(1) },
    previewDetail: { color: t.colors.textSecondary },
    field: { gap: space(2.5) },
    fieldLabel: { color: t.colors.textSecondary },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
    preset: {
      minWidth: 70,
      paddingHorizontal: space(4),
      paddingVertical: space(2.5),
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    note: { marginTop: space(1) },
    disclaimer: { color: t.colors.textMuted, textAlign: 'center' },
  });
