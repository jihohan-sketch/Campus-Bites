import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { RadarEntry } from '../hooks/useRadar';
import { colors, radarStatusTheme, space, type } from '../theme';
import type { RadarStatus } from '../types';
import { Avatar } from './Avatar';

interface RadarCanvasProps {
  entries: RadarEntry[];
  size: number;
  /** Emoji of the signed-in student, shown at the centre. */
  meEmoji: string;
  meStatus: RadarStatus;
}

const AVATAR_SIZE = 40;
const MAX_PLOTTED = 12;

interface PlottedFriend {
  entry: RadarEntry;
  left: number;
  top: number;
}

/**
 * The Friend Radar: the cafeteria at the centre, friends orbiting at a radius
 * that reflects how close they are to eating. A slow sweep makes it read as
 * live without demanding attention.
 */
export function RadarCanvas({ entries, size, meEmoji, meStatus }: RadarCanvasProps) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [sweep]);

  const plotted = useMemo<PlottedFriend[]>(() => {
    const center = size / 2;
    const usable = center - AVATAR_SIZE / 2 - space(1);

    // Distribute each status ring evenly around the circle so avatars on the
    // same ring never stack on top of one another.
    const byStatus = new Map<RadarStatus, RadarEntry[]>();
    entries.slice(0, MAX_PLOTTED).forEach((entry) => {
      const bucket = byStatus.get(entry.status);
      if (bucket) bucket.push(entry);
      else byStatus.set(entry.status, [entry]);
    });

    const result: PlottedFriend[] = [];
    byStatus.forEach((bucket, status) => {
      const ring = radarStatusTheme[status].ring;
      const radiusPx = usable * ring;
      // A per-ring offset keeps neighbouring rings from lining up radially.
      const offset = ring * Math.PI;

      bucket.forEach((entry, index) => {
        const angle = offset + (index / bucket.length) * Math.PI * 2;
        result.push({
          entry,
          left: center + Math.cos(angle) * radiusPx - AVATAR_SIZE / 2,
          top: center + Math.sin(angle) * radiusPx - AVATAR_SIZE / 2,
        });
      });
    });

    return result;
  }, [entries, size]);

  const rotate = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const meTheme = radarStatusTheme[meStatus];

  return (
    <View style={[styles.canvas, { width: size, height: size }]}>
      {[1, 0.66, 0.34].map((scale) => (
        <View
          key={scale}
          style={[
            styles.ring,
            {
              width: size * scale,
              height: size * scale,
              borderRadius: (size * scale) / 2,
            },
          ]}
        />
      ))}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.sweepContainer,
          { width: size, height: size, transform: [{ rotate }] },
        ]}
      >
        <View style={[styles.sweepArm, { height: size / 2, top: 0, left: size / 2 - 1 }]} />
      </Animated.View>

      <View style={[styles.center, { left: size / 2 - 30, top: size / 2 - 30 }]}>
        <Avatar emoji={meEmoji} size={52} ringColor={meTheme.color} background={colors.surface} />
        <Text style={[type.caption, styles.centerLabel]}>나</Text>
      </View>

      {plotted.map(({ entry, left, top }) => {
        const statusTheme = radarStatusTheme[entry.status];
        return (
          <View key={entry.friend.uid} style={[styles.friend, { left, top }]}>
            <Avatar
              emoji={entry.friend.emoji}
              size={AVATAR_SIZE}
              ringColor={statusTheme.color}
              background={colors.surface}
            />
            <Text style={[type.caption, styles.friendName]} numberOfLines={1}>
              {entry.friend.displayName}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  sweepContainer: { position: 'absolute', alignItems: 'center' },
  sweepArm: {
    position: 'absolute',
    width: 2,
    backgroundColor: colors.brand,
    opacity: 0.22,
  },
  center: { position: 'absolute', width: 60, alignItems: 'center', gap: space(1) },
  centerLabel: { color: colors.textSecondary, fontWeight: '600' },
  friend: { position: 'absolute', width: AVATAR_SIZE, alignItems: 'center' },
  friendName: {
    color: colors.textSecondary,
    marginTop: space(1),
    width: 64,
    textAlign: 'center',
  },
});
