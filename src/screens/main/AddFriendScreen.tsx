import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthPrompt } from '../../components/AuthPrompt';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { MadeBy } from '../../components/MadeBy';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { describeAuthError } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../hooks/useFriends';
import type { RootStackParamList } from '../../navigation/types';
import {
  FriendActionError,
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '../../services/friends';
import { findProfileByFriendCode } from '../../services/profile';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../../theme';
import type { Friend, FriendRequest } from '../../types';
import { formatRelativeTime } from '../../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'AddFriend'>;

export function AddFriendScreen({ navigation }: Props) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { profile, user } = useAuth();
  const { friends, incoming, outgoing } = useFriends(profile?.uid ?? null);

  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleSend = async () => {
    if (!profile) return;
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 4) {
      setFeedback({ tone: 'error', message: '친구 코드를 정확히 입력해 주세요.' });
      return;
    }

    setSending(true);
    setFeedback(null);
    try {
      const target = await findProfileByFriendCode(normalized);
      if (!target) {
        setFeedback({ tone: 'error', message: '그 코드를 쓰는 학생이 없어요.' });
        return;
      }

      const outcome = await sendFriendRequest(profile, target);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCode('');
      setFeedback({
        tone: 'ok',
        message:
          outcome === 'accepted'
            ? `${target.displayName}님과 친구가 되었어요!`
            : `${target.displayName}님에게 요청을 보냈어요.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message:
          error instanceof FriendActionError ? error.message : describeAuthError(error),
      });
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (request: FriendRequest) => {
    if (!profile) return;
    setBusyId(request.id);
    try {
      await acceptFriendRequest(profile, request);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setFeedback({ tone: 'error', message: describeAuthError(error) });
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (request: FriendRequest) => {
    setBusyId(request.id);
    try {
      await declineFriendRequest(request);
    } catch (error) {
      setFeedback({ tone: 'error', message: describeAuthError(error) });
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (request: FriendRequest) => {
    setBusyId(request.id);
    try {
      await cancelFriendRequest(request);
    } catch (error) {
      setFeedback({ tone: 'error', message: describeAuthError(error) });
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = (friend: Friend) => {
    if (!profile) return;
    Alert.alert('친구 삭제', `${friend.displayName}님을 친구 목록에서 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          setBusyId(friend.uid);
          removeFriend(profile.uid, friend.uid)
            .catch((error) =>
              setFeedback({ tone: 'error', message: describeAuthError(error) }),
            )
            .finally(() => setBusyId(null));
        },
      },
    ]);
  };

  if (!user || !profile) {
    return <AuthPrompt title="친구 기능은 로그인 후 사용할 수 있어요" />;
  }

  return (
    <Screen topInset={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Card style={styles.myCodeCard}>
            <Text style={[text.label, styles.myCodeLabel]}>내 친구 코드</Text>
            <Text style={[text.mono, styles.myCode]} selectable>
              {profile?.friendCode ?? '------'}
            </Text>
            <Text style={[text.caption, styles.myCodeHint]}>
              이 코드를 친구에게 알려 주면 서로 친구 목록에 추가돼요.
            </Text>
          </Card>

          <View style={styles.section}>
            <Text style={[text.label, styles.sectionTitle]}>친구 코드로 추가</Text>
            <TextField
              label="친구 코드"
              value={code}
              onChangeText={(next) => setCode(next.toUpperCase())}
              placeholder="예: K7M2QP"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              error={feedback?.tone === 'error' ? feedback.message : null}
              hint={feedback?.tone === 'ok' ? feedback.message : undefined}
            />
            <Button
              label="요청 보내기"
              onPress={handleSend}
              loading={sending}
              disabled={code.trim().length < 4}
              fullWidth
            />
          </View>

          {incoming.length > 0 ? (
            <View style={styles.section}>
              <Text style={[text.label, styles.sectionTitle]}>받은 요청</Text>
              {incoming.map((request) => (
                <Card key={request.id} style={styles.requestCard}>
                  <Avatar emoji={request.fromEmoji} size={44} />
                  <View style={styles.requestBody}>
                    <Text style={[text.bodyStrong, styles.requestName]} numberOfLines={1}>
                      {request.fromName}
                    </Text>
                    <Text style={[text.caption, styles.requestMeta]} numberOfLines={1}>
                      {[request.fromSchoolName, formatRelativeTime(request.createdAt)]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <Button
                      label="수락"
                      size="sm"
                      onPress={() => void handleAccept(request)}
                      loading={busyId === request.id}
                    />
                    <Button
                      label="거절"
                      size="sm"
                      variant="secondary"
                      onPress={() => void handleDecline(request)}
                      disabled={busyId === request.id}
                    />
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          {outgoing.length > 0 ? (
            <View style={styles.section}>
              <Text style={[text.label, styles.sectionTitle]}>보낸 요청</Text>
              {outgoing.map((request) => (
                <Card key={request.id} style={styles.requestCard} variant="flat">
                  <Ionicons name="paper-plane-outline" size={20} color={t.colors.textSecondary} />
                  <View style={styles.requestBody}>
                    <Text style={[text.body, styles.requestName]}>수락을 기다리는 중</Text>
                    <Text style={[text.caption, styles.requestMeta]}>
                      {formatRelativeTime(request.createdAt)}
                    </Text>
                  </View>
                  <Button
                    label="취소"
                    size="sm"
                    variant="secondary"
                    onPress={() => void handleCancel(request)}
                    loading={busyId === request.id}
                  />
                </Card>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[text.label, styles.sectionTitle]}>내 친구 {friends.length}명</Text>
            {friends.length === 0 ? (
              <EmptyState
                emoji="🧑‍🤝‍🧑"
                title="친구 목록이 비어 있어요"
                description="위의 코드를 친구에게 보내 보세요."
              />
            ) : (
              friends.map((friend) => (
                <Pressable
                  key={friend.uid}
                  accessibilityRole="button"
                  accessibilityLabel={`${friend.displayName} 삭제`}
                  onLongPress={() => confirmRemove(friend)}
                  style={({ pressed }) => [styles.friendRow, pressed ? styles.pressed : null]}
                >
                  <Avatar emoji={friend.emoji} size={40} />
                  <View style={styles.requestBody}>
                    <Text style={[text.bodyStrong, styles.requestName]} numberOfLines={1}>
                      {friend.displayName}
                    </Text>
                    <Text style={[text.caption, styles.requestMeta]} numberOfLines={1}>
                      {friend.schoolName || '학교 미설정'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="친구 삭제"
                    hitSlop={10}
                    onPress={() => confirmRemove(friend)}
                  >
                    <Ionicons name="close" size={18} color={t.colors.textMuted} />
                  </Pressable>
                </Pressable>
              ))
            )}
          </View>

          <Button
            label="닫기"
            variant="ghost"
            onPress={() => navigation.goBack()}
            fullWidth
          />

          <MadeBy />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: space(5), paddingBottom: space(10), gap: space(5) },
    myCodeCard: { alignItems: 'center', gap: space(1.5), paddingVertical: space(6) },
    myCodeLabel: { color: t.colors.textSecondary },
    myCode: { color: t.colors.brand, fontSize: 30, lineHeight: 36 },
    myCodeHint: { color: t.colors.textMuted, textAlign: 'center' },
    section: { gap: space(3) },
    sectionTitle: { color: t.colors.textSecondary },
    requestCard: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    requestBody: { flex: 1, gap: space(0.5) },
    requestName: { color: t.colors.text },
    requestMeta: { color: t.colors.textMuted },
    requestActions: { gap: space(1.5) },
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      backgroundColor: t.colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      padding: space(3.5),
    },
    pressed: { opacity: 0.85 },
  });
