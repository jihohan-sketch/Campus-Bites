import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RadarEntry } from '../hooks/useRadar';
import { colors, radarStatusTheme, radius, space, type } from '../theme';
import { formatRelativeTime } from '../utils/date';
import { Avatar } from './Avatar';
import { Pill } from './Pill';

interface FriendRowProps {
  entry: RadarEntry;
  now: number;
  onPress?: () => void;
}

/** One friend in the radar list: who, where, and how fresh the signal is. */
export function FriendRow({ entry, now, onPress }: FriendRowProps) {
  const statusTheme = radarStatusTheme[entry.status];
  const { friend, presence } = entry;
  const spot = presence?.spot?.trim() ?? '';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <Avatar emoji={friend.emoji} size={44} ringColor={statusTheme.color} />

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[type.bodyStrong, styles.name]} numberOfLines={1}>
            {friend.displayName}
          </Text>
          <Pill
            label={`${statusTheme.emoji} ${statusTheme.label}`}
            color={statusTheme.color}
            background={statusTheme.soft}
          />
        </View>

        <Text style={[type.caption, styles.meta]} numberOfLines={1}>
          {spot ? `${spot} · ` : ''}
          {presence ? formatRelativeTime(presence.updatedAt, now) : '아직 소식 없음'}
          {friend.schoolName ? ` · ${friend.schoolName}` : ''}
        </Text>
      </View>

      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    paddingVertical: space(3),
    paddingHorizontal: space(4),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  body: { flex: 1, gap: space(1) },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  name: { color: colors.text, flexShrink: 1 },
  meta: { color: colors.textMuted },
});
