import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import {
  BEST_BAND,
  LUNCH_RUSH_BANDS,
  LUNCH_RUSH_START,
  RUSH_ESTIMATE_DISCLAIMER,
  formatClock,
  progressOf,
  type RushBand,
} from '../config/lunchRush';
import { useLunchLine } from '../hooks/useLunchLine';
import {
  formatRecommendedTime,
  formatWait,
  type LunchLineSnapshot,
} from '../services/lunchLine';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import { formatKstClockSeconds } from '../utils/date';
import { Pulse, USE_NATIVE_DRIVER, useAnimatedTo, useChangeFade } from './motion';

/** How often a fresh reading is taken. Slow enough to be calm, fast enough to
 *  make "마지막 업데이트" visibly move while a student is looking at it. */
const REFRESH_MS = 15000;

/** Blocks in the ████████░░ crowd meter. */
const BLOCK_COUNT = 10;
const BLOCKS = Array.from({ length: BLOCK_COUNT }, (_, index) => index);

interface LunchLineLiveProps {
  /** Overrides the live KST clock; used for previews and tests. */
  nowMinutes?: number;
  /** Drops the band legend for the tighter slot on 급식표. */
  compact?: boolean;
  /** Dims the card and stops the ticker when the student is on another day. */
  muted?: boolean;
}

/**
 * A live read on the lunch queue: how crowded the cafeteria is right now, how
 * long the line is, and when to go instead.
 *
 * Every number comes off one `LunchLineSnapshot` (see `services/lunchLine`), so
 * the whole card moves together and can be pointed at a real feed later without
 * touching this file. The readings are simulated from the timetable today, and
 * the card says so.
 */
export function LunchLineLive({ nowMinutes, compact = false, muted = false }: LunchLineLiveProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const snapshot = useLunchLine({ refreshMs: REFRESH_MS, nowMinutes, active: !muted });
  const isLive = !muted && snapshot.phase === 'during';
  const bandTheme = snapshot.crowdLevel === 'closed' ? null : t.rush[snapshot.crowdLevel];
  const accent = bandTheme?.color ?? t.colors.textSecondary;

  return (
    <View style={[styles.card, t.shadow.sm, muted ? styles.muted : null]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>🍽️</Text>
          <Text style={[text.subheading, styles.title]}>실시간 급식 줄</Text>
        </View>
        {isLive ? <LiveBadge /> : <EstimateChip />}
      </View>

      <CrowdBlock snapshot={snapshot} accent={accent} soft={bandTheme?.soft ?? null} />

      <View style={styles.stats}>
        <Stat
          icon="time-outline"
          label="예상 대기시간"
          value={formatWait(snapshot.estimatedWait)}
          accent={isLive ? accent : t.colors.textSecondary}
          changeKey={snapshot.estimatedWait}
        />
        <Stat
          icon="walk-outline"
          label="추천 방문 시간"
          value={formatRecommendedTime(snapshot.recommendedTime)}
          accent={isLive ? t.colors.accent : t.colors.textSecondary}
          changeKey={snapshot.recommendedTime}
        />
      </View>

      <Timeline snapshot={snapshot} isLive={isLive} accent={accent} />

      {compact ? null : (
        <View style={styles.legend}>
          {LUNCH_RUSH_BANDS.map((band) => (
            <LegendRow
              key={band.level}
              band={band}
              active={isLive && snapshot.crowdLevel === band.level}
            />
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[text.caption, styles.updated]} numberOfLines={1}>
          마지막 업데이트 {formatKstClockSeconds(snapshot.lastUpdated)}
          {isLive ? ` · ${REFRESH_MS / 1000}초마다 갱신` : ''}
        </Text>
        <Text style={[text.caption, styles.disclaimer]}>ⓘ {RUSH_ESTIMATE_DISCLAIMER}</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------ crowd meter */

/** 현재 혼잡도: the level, the ████████░░ bar and the one line under it. */
function CrowdBlock({
  snapshot,
  accent,
  soft,
}: {
  snapshot: LunchLineSnapshot;
  accent: string;
  soft: string | null;
}) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const band = snapshot.currentTimeSlot
    ? LUNCH_RUSH_BANDS.find((entry) => entry.level === snapshot.currentTimeSlot?.level)
    : null;

  // Only the level heading and the sentence cross-fade; the bar slides on its
  // own so the two readings never look like they belong to different moments.
  const fade = useChangeFade(snapshot.crowdLevel);

  return (
    <View style={[styles.crowd, { backgroundColor: soft ?? t.colors.surfaceMuted }]}>
      <View style={styles.crowdTop}>
        <Text style={[text.overline, styles.crowdEyebrow]}>현재 혼잡도</Text>
        {snapshot.currentTimeSlot ? (
          <View style={[styles.slotChip, { borderColor: accent }]}>
            <Text style={[text.caption, styles.slotText, { color: accent }]}>
              {snapshot.currentTimeSlot.label}
            </Text>
          </View>
        ) : null}
      </View>

      <Animated.View style={[styles.crowdHeadline, { opacity: fade }]}>
        <Text style={[text.title, { color: accent }]}>
          {band ? band.crowdLabel : snapshot.phase === 'before' ? '배식 전' : '배식 종료'}
        </Text>
        <Text style={[text.caption, styles.crowdPercent, { color: accent }]}>
          {Math.round(snapshot.crowdRatio * 100)}%
        </Text>
      </Animated.View>

      <CrowdBar ratio={snapshot.crowdRatio} color={accent} />

      <Animated.Text style={[text.body, styles.crowdMessage, { opacity: fade }]}>
        {snapshot.message}
      </Animated.Text>
    </View>
  );
}

/**
 * Ten blocks that fill up, ████████░░ style. The filled blocks are a second
 * copy of the row clipped to an animated width — one animated view rather than
 * ten, and it is decorative, so it never takes a touch.
 */
function CrowdBar({ ratio, color }: { ratio: number; color: string }) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const [trackWidth, setTrackWidth] = useState(0);
  // Snapped to whole blocks so the meter reads as a discrete gauge.
  const filled = Math.round(ratio * BLOCK_COUNT) / BLOCK_COUNT;
  const grow = useAnimatedTo(filled, 620);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(ratio * 100), min: 0, max: 100 }}
      style={styles.bar}
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      <View style={styles.blockRow} pointerEvents="none">
        {BLOCKS.map((index) => (
          <View key={index} style={[styles.block, { backgroundColor: t.colors.track }]} />
        ))}
      </View>

      {trackWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.barFill,
            { width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        >
          <View style={[styles.blockRowFilled, { width: trackWidth }]}>
            {BLOCKS.map((index) => (
              <View key={index} style={[styles.block, { backgroundColor: color }]} />
            ))}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ stats */

function Stat({
  icon,
  label,
  value,
  accent,
  changeKey,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
  changeKey: unknown;
}) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const fade = useChangeFade(changeKey);

  return (
    <View style={styles.stat}>
      <View style={styles.statLabelRow}>
        <Ionicons name={icon} size={13} color={t.colors.textSecondary} />
        <Text style={[text.caption, styles.statLabel]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Animated.Text
        numberOfLines={1}
        style={[text.heading, styles.statValue, { color: accent, opacity: fade }]}
      >
        {value}
      </Animated.Text>
    </View>
  );
}

/* --------------------------------------------------------------- timeline */

/** 11:30 → 11:40 → 12:00 → 12:30, with the marker sitting on now. */
function Timeline({
  snapshot,
  isLive,
  accent,
}: {
  snapshot: LunchLineSnapshot;
  isLive: boolean;
  accent: string;
}) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const [trackWidth, setTrackWidth] = useState(0);

  // The marker slides to its new spot rather than jumping on each reading.
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (trackWidth === 0) return;
    const animation = Animated.timing(slide, {
      toValue: snapshot.timelineProgress * trackWidth,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [snapshot.timelineProgress, trackWidth, slide]);

  const ticks = useMemo(
    () => [LUNCH_RUSH_START, ...LUNCH_RUSH_BANDS.map((band) => band.end)],
    [],
  );

  return (
    <View>
      <View
        accessibilityRole="image"
        accessibilityLabel={LUNCH_RUSH_BANDS.map(
          (band) => `${formatClock(band.start)}부터 ${formatClock(band.end)}까지 ${band.label}`,
        ).join(', ')}
        style={styles.timeline}
        onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      >
        {LUNCH_RUSH_BANDS.map((band) => {
          const bandTheme = t.rush[band.level];
          const active = isLive && snapshot.crowdLevel === band.level;
          return (
            <View
              key={band.level}
              style={[
                styles.segment,
                {
                  flex: band.end - band.start,
                  backgroundColor: bandTheme.color,
                  opacity: active ? 1 : bandTheme.intensity * 0.42,
                },
              ]}
            />
          );
        })}

        {isLive ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.marker, { transform: [{ translateX: slide }] }]}
          >
            <View style={[styles.markerDot, { borderColor: accent }]} />
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.ticks} pointerEvents="none">
        {ticks.map((tickMinutes, index, all) => {
          const isFirst = index === 0;
          const isLast = index === all.length - 1;
          // Ticks sit on their band boundary, so they follow the same
          // proportional scale as the bar rather than spreading evenly.
          const anchor = isFirst
            ? styles.tickFirst
            : isLast
              ? styles.tickLast
              : { left: `${progressOf(tickMinutes) * 100}%` as const };

          return (
            <Text key={tickMinutes} style={[text.caption, styles.tick, anchor]}>
              {formatClock(tickMinutes)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

/* ----------------------------------------------------------------- badges */

/** A softly pulsing dot, the usual shorthand for "this is updating". */
function LiveBadge() {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  return (
    <View style={[styles.liveBadge, { backgroundColor: t.colors.dangerSoft }]}>
      <Pulse duration={900} scaleTo={1.5} minOpacity={0.35}>
        <View style={[styles.liveDot, { backgroundColor: t.colors.danger }]} />
      </Pulse>
      <Text style={[text.overline, { color: t.colors.danger }]}>실시간</Text>
    </View>
  );
}

function EstimateChip() {
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.estimateChip}>
      <Text style={[text.overline, styles.estimateText]}>예상</Text>
    </View>
  );
}

function LegendRow({ band, active }: { band: RushBand; active: boolean }) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const bandTheme = t.rush[band.level];
  const isBest = band.level === BEST_BAND.level;

  return (
    <View style={[styles.legendRow, active ? { backgroundColor: bandTheme.soft } : null]}>
      <View style={[styles.legendDot, { backgroundColor: bandTheme.color }]} />

      <View style={styles.legendBody}>
        <View style={styles.legendTop}>
          <Text style={[text.bodyStrong, styles.legendTime]}>
            {formatClock(band.start)} – {formatClock(band.end)}
          </Text>
          <Text style={[text.overline, { color: bandTheme.color }]}>{band.status}</Text>
          {isBest ? (
            <View style={styles.bestChip}>
              <Text style={[text.caption, styles.bestChipText]}>가기 좋은 시간</Text>
            </View>
          ) : null}
        </View>
        <Text style={[text.caption, styles.legendDetail]}>{band.detail}</Text>
      </View>
    </View>
  );
}

const BAR_HEIGHT = 12;
const TIMELINE_HEIGHT = 10;
const TICK_WIDTH = 44;
const MARKER = 16;

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: space(4.5),
      gap: space(3.5),
    },
    muted: { opacity: 0.6 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space(2),
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
    titleEmoji: { fontSize: 16 },
    title: { color: t.colors.text },

    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1.5),
      paddingHorizontal: space(2.5),
      paddingVertical: space(1.5),
      borderRadius: radius.pill,
    },
    liveDot: { width: 7, height: 7, borderRadius: 4 },

    estimateChip: {
      paddingHorizontal: space(2.5),
      paddingVertical: space(1.5),
      borderRadius: radius.pill,
      backgroundColor: t.colors.surfaceMuted,
    },
    estimateText: { color: t.colors.textSecondary },

    /* crowd meter */
    crowd: { borderRadius: radius.lg, padding: space(3.5), gap: space(2.5) },
    crowdTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space(2),
    },
    crowdEyebrow: { color: t.colors.textSecondary },
    slotChip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.pill,
      paddingHorizontal: space(2),
      paddingVertical: space(0.5),
    },
    slotText: { fontWeight: '700', fontVariant: ['tabular-nums'] },
    crowdHeadline: { flexDirection: 'row', alignItems: 'baseline', gap: space(2) },
    crowdPercent: { fontWeight: '800', fontVariant: ['tabular-nums'] },
    crowdMessage: { color: t.colors.text },

    bar: { height: BAR_HEIGHT, justifyContent: 'center' },
    blockRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      gap: 3,
    },
    /** The filled copy is pinned left and sized to the track, so clipping the
     *  wrapper reveals it block by block from the left. */
    blockRowFilled: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      gap: 3,
    },
    block: { flex: 1, height: '100%', borderRadius: 3 },
    barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },

    /* stats */
    stats: { flexDirection: 'row', gap: space(2.5) },
    stat: {
      flex: 1,
      gap: space(1),
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.md,
      paddingHorizontal: space(3.5),
      paddingVertical: space(3),
    },
    statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
    statLabel: { color: t.colors.textSecondary, flexShrink: 1 },
    statValue: { fontVariant: ['tabular-nums'] },

    /* timeline */
    timeline: {
      flexDirection: 'row',
      height: TIMELINE_HEIGHT,
      borderRadius: radius.pill,
      gap: 3,
    },
    segment: { height: '100%', borderRadius: 4 },
    marker: { position: 'absolute', top: (TIMELINE_HEIGHT - MARKER) / 2, left: -MARKER / 2 },
    markerDot: {
      width: MARKER,
      height: MARKER,
      borderRadius: MARKER / 2,
      backgroundColor: t.colors.surface,
      borderWidth: 3.5,
    },

    ticks: { height: 16, marginTop: space(2) },
    tick: {
      position: 'absolute',
      color: t.colors.textMuted,
      width: TICK_WIDTH,
      marginLeft: -TICK_WIDTH / 2,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    tickFirst: { left: 0, marginLeft: 0, textAlign: 'left' },
    tickLast: { right: 0, marginLeft: 0, textAlign: 'right' },

    /* legend */
    legend: { gap: space(1) },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space(2.5),
      paddingVertical: space(2.5),
      paddingHorizontal: space(2.5),
      borderRadius: radius.md,
    },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
    legendBody: { flex: 1, gap: space(0.5) },
    legendTop: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
    legendTime: { color: t.colors.text, fontVariant: ['tabular-nums'] },
    legendDetail: { color: t.colors.textSecondary },
    bestChip: {
      backgroundColor: t.colors.accentSoft,
      paddingHorizontal: space(2),
      paddingVertical: space(0.5),
      borderRadius: radius.pill,
    },
    bestChipText: { color: t.colors.accent, fontWeight: '700' },

    footer: { gap: space(1) },
    updated: { color: t.colors.textSecondary, fontVariant: ['tabular-nums'] },
    disclaimer: { color: t.colors.textMuted },
  });
