import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
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

import { AuthPrompt } from '../../components/AuthPrompt';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { describeAuthError } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { syncFriendMirrors } from '../../services/friends';
import { AVATAR_EMOJIS, updateProfile } from '../../services/profile';
import { colors, radius, space, type } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { profile, user } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [emoji, setEmoji] = useState(profile?.emoji ?? '🍚');
  const [grade, setGrade] = useState(profile?.grade ? String(profile.grade) : '');
  const [classNo, setClassNo] = useState(profile?.classNo ? String(profile.classNo) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = displayName.trim();
  const canSave = trimmedName.length > 0 && !saving;

  const handleSave = async () => {
    if (!profile || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      const next = {
        displayName: trimmedName,
        emoji,
        grade: parseOptionalInt(grade),
        classNo: parseOptionalInt(classNo),
      };
      await updateProfile(profile.uid, next);
      // Keep the copies friends see in step with the source of truth.
      await syncFriendMirrors({ ...profile, ...next });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (saveError) {
      setError(describeAuthError(saveError));
      setSaving(false);
    }
  };

  if (!user || !profile) {
    return <AuthPrompt title="프로필 수정은 로그인 후 가능해요" />;
  }

  return (
    <Screen topInset={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={[type.label, styles.fieldLabel]}>아바타</Text>
            <View style={styles.emojiGrid}>
              {AVATAR_EMOJIS.map((option) => {
                const selected = option === emoji;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`아바타 ${option}`}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setEmoji(option);
                    }}
                    style={({ pressed }) => [
                      styles.emojiOption,
                      selected ? styles.emojiSelected : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.emojiText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <TextField
            label="이름"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="친구들에게 보일 이름"
            maxLength={20}
            error={error}
          />

          <View style={styles.classRow}>
            <TextField
              label="학년"
              value={grade}
              onChangeText={setGrade}
              placeholder="선택"
              keyboardType="number-pad"
              maxLength={1}
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

          <Button
            label="저장하기"
            onPress={handleSave}
            loading={saving}
            disabled={!canSave}
            size="lg"
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function parseOptionalInt(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space(5), paddingBottom: space(10), gap: space(5) },
  field: { gap: space(2.5) },
  fieldLabel: { color: colors.textSecondary },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  emojiOption: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiSelected: { borderColor: colors.brand, borderWidth: 2, backgroundColor: colors.brandSoft },
  pressed: { opacity: 0.8 },
  emojiText: { fontSize: 26 },
  classRow: { flexDirection: 'row', gap: space(3) },
  classField: { flex: 1 },
});
