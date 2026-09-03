import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { schoolKeyOf } from '../../config/school';
import { AuthPrompt } from '../../components/AuthPrompt';
import { Button } from '../../components/Button';
import { CrowdLevelPicker } from '../../components/CrowdLevelPicker';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TextField } from '../../components/TextField';
import { describeAuthError } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { submitCrowdReport } from '../../services/crowd';
import { colors, crowdStepFor, mealTheme, radius, space, type } from '../../theme';
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
  const [level, setLevel] = useState<CrowdLevel>(3);
  const [mealType, setMealType] = useState<MealType>(() => currentMealType(currentHourInKst()));
  const [waitMinutes, setWaitMinutes] = useState(5);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = crowdStepFor(level);
  const mealOptions = useMemo(
    () => MEAL_TYPES.map((value) => ({ value, label: mealTheme[value].label })),
    [],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitCrowdReport(profile, schoolKeyOf(), {
        level,
        waitMinutes,
        note,
        mealType,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (submitError) {
      setError(describeAuthError(submitError));
      setSubmitting(false);
    }
  };

  return (
    <Screen topInset={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.preview, { backgroundColor: step.soft }]}>
            <Text style={[type.title, { color: step.color }]}>{step.label}</Text>
            <Text style={[type.body, styles.previewDetail]}>{step.detail}</Text>
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
                  <Button
                    key={preset}
                    label={preset === 0 ? '바로' : `${preset}분`}
                    size="sm"
                    variant={selected ? 'primary' : 'secondary'}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setWaitMinutes(preset);
                    }}
                    style={styles.preset}
                  />
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
          />

          <Text style={[type.caption, styles.disclaimer]}>
            제보에는 이름과 이모지가 함께 표시되고, 같은 학교 학생만 볼 수 있어요.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[type.label, styles.fieldLabel]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space(5), paddingBottom: space(10), gap: space(5) },
  preview: {
    borderRadius: radius.lg,
    padding: space(5),
    alignItems: 'center',
    gap: space(1),
  },
  previewDetail: { color: colors.textSecondary },
  field: { gap: space(2.5) },
  fieldLabel: { color: colors.textSecondary },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  preset: { minWidth: 68, paddingHorizontal: space(3) },
  note: { marginTop: space(1) },
  disclaimer: { color: colors.textMuted, textAlign: 'center' },
});
