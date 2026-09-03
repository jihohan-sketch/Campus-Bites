import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { FriendRow } from '../../components/FriendRow';
import { Pill } from '../../components/Pill';
import { RadarCanvas } from '../../components/RadarCanvas';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { describeAuthError } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useFriends } from '../../hooks/useFriends';
import { useRadar } from '../../hooks/useRadar';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { publishPresence } from '../../services/radar';
import { RADAR_STATUS_ORDER, colors, radarStatusTheme, radius, space, type } from '../../theme';
import type { RadarStatus } from '../../types';
import { currentHourInKst } from '../../utils/date';
import { currentMealType } from '../../utils/meal';

type Props = BottomTabScreenProps<MainTabParamList, 'Radar'>;

export function RadarScreen(_props: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, user } = useAuth();
  const { width } = useWindowDimensions();

  const { friends, incoming, loading: friendsLoading } = useFriends(profile?.uid ?? null);
  const { entries, myPresence, activeCount, error, now } = useRadar(profile?.uid ?? null, friends);

  const [spot, setSpot] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const myStatus: RadarStatus = myPresence?.status ?? 'idle';
  const canvasSize = Math.min(width - space(10), 320);

  // Seed the spot field from the last published value, without fighting typing.
  const effectiveSpot = spot || myPresence?.spot || '';

  const setStatus = useCallback(
    async (status: RadarStatus) => {
      if (!profile) {
        navigation.navigate('SignIn');
        return;
      }
      setPublishing(true);
      setPublishError(null);
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await publishPresence(profile, {
          status,
          spot: effectiveSpot,
          mealType: currentMealType(currentHourInKst()),
        });
      } catch (error_) {
        setPublishError(describeAuthError(error_));
      } finally {
        setPublishing(false);
      }
    },
    [profile, effectiveSpot, navigation],
  );

  const grouped = useMemo(
    () =>
      RADAR_STATUS_ORDER.map((status) => ({
        status,
        items: entries.filter((entry) => entry.status === status),
      })).filter((group) => group.items.length > 0),
    [entries],
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[type.caption, styles.eyebrow]}>친구 레이더</Text>
            <Text style={[type.display, styles.title]}>
              {activeCount > 0 ? `${activeCount}명이 급식 중` : '지금은 조용해요'}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="친구 추가"
            onPress={() => (user ? navigation.navigate('AddFriend') : navigation.navigate('SignIn'))}
            style={({ pressed }) => [styles.addButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.text} />
            {incoming.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{incoming.length}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {friends.length > 0 ? (
          <RadarCanvas
            entries={entries}
            size={canvasSize}
            meEmoji={profile?.emoji ?? '🍚'}
            meStatus={myStatus}
          />
        ) : null}

        {!user ? (
          <Text style={[type.caption, styles.guestHint]}>
            로그인하면 내 상태를 친구들에게 공유할 수 있어요.
          </Text>
        ) : null}

        <View style={styles.statusCard}>
          <Text style={[type.label, styles.statusTitle]}>내 상태</Text>
          <View style={styles.statusRow}>
            {RADAR_STATUS_ORDER.map((status) => {
              const statusTheme = radarStatusTheme[status];
              const selected = myStatus === status;
              return (
                <Pressable
                  key={status}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: publishing }}
                  disabled={publishing}
                  onPress={() => void setStatus(status)}
                  style={({ pressed }) => [
                    styles.statusOption,
                    {
                      backgroundColor: selected ? statusTheme.soft : colors.surface,
                      borderColor: selected ? statusTheme.color : colors.border,
                    },
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.statusEmoji}>{statusTheme.emoji}</Text>
                  <Text
                    style={[
                      type.caption,
                      styles.statusLabel,
                      { color: selected ? statusTheme.color : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {statusTheme.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextField
            label="어디에 있나요? (선택)"
            value={effectiveSpot}
            onChangeText={setSpot}
            placeholder="예: 3층 창가 자리"
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={() => void setStatus(myStatus)}
            error={publishError}
            hint="상태를 다시 누르면 위치도 함께 저장돼요"
          />
        </View>

        {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}

        {friends.length === 0 && !friendsLoading ? (
          <EmptyState
            emoji="👋"
            title="아직 친구가 없어요"
            description="친구 코드를 주고받으면 서로 급식실에 언제 가는지 볼 수 있어요."
            actionLabel={user ? '친구 추가하기' : '로그인하고 친구 추가'}
            onAction={() => (user ? navigation.navigate('AddFriend') : navigation.navigate('SignIn'))}
          />
        ) : (
          grouped.map((group) => (
            <View key={group.status} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={[type.label, styles.groupTitle]}>
                  {radarStatusTheme[group.status].emoji} {radarStatusTheme[group.status].label}
                </Text>
                <Pill label={`${group.items.length}명`} />
              </View>
              <View style={styles.groupList}>
                {group.items.map((entry) => (
                  <FriendRow key={entry.friend.uid} entry={entry} now={now} />
                ))}
              </View>
            </View>
          ))
        )}

        {friends.length > 0 ? (
          <Button
            label="친구 추가"
            variant="secondary"
            onPress={() => navigation.navigate('AddFriend')}
            fullWidth
            leading={<Ionicons name="person-add-outline" size={16} color={colors.text} />}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(5), paddingBottom: space(10), gap: space(5) },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3) },
  headerText: { flex: 1, gap: space(1) },
  eyebrow: { color: colors.brand, fontWeight: '700', letterSpacing: 0.4 },
  title: { color: colors.text },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    gap: space(3),
  },
  statusTitle: { color: colors.textSecondary },
  statusRow: { flexDirection: 'row', gap: space(2) },
  statusOption: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: space(3),
    paddingHorizontal: space(1),
    alignItems: 'center',
    gap: space(1),
  },
  statusEmoji: { fontSize: 20 },
  statusLabel: { fontWeight: '600' },
  error: { color: colors.danger },
  guestHint: { color: colors.textMuted, textAlign: 'center' },
  group: { gap: space(2.5) },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  groupTitle: { color: colors.textSecondary },
  groupList: { gap: space(2) },
});
