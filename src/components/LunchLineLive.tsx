import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import {
  BEST_BAND,
  LUNCH_RUSH_BANDS,
  LUNCH_RUSH_END,
  LUNCH_RUSH_START,
  RUSH_ESTIMATE_DISCLAIMER,
  formatClock,
  progressOf,
  rushAdvice,
  type RushBand,
} from '../config/lunchRush';
import { useNow } from '../hooks/useNow';
import { colors, radius, shadow, space, type as text } from '../theme';
import { currentMinutesInKst } from '../utils/date';

/** react-native-web has no native animation module; driving there warns. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface LunchLineLiveProps {
  /** Overrides the live KST clock; used for previews and tests. */
  nowMinutes?: number;
  /** Drops the legend and disclaimer for the tighter slot on 급식표. */
  compact?: boolean;
  /** Dims the card when the student is looking at another day. */
  muted?: boolean;
}

/**
 * A live-feeling read on the lunch queue: where the clock currently sits in the
 * 11:30 – 12:30 service window, and how long the student should wait to skip
 * the rush. The levels are estimates from the timetable, never a sensor.
 */
export function LunchLineLive({ nowMinutes, compact = false, muted = false }: LunchLineLiveProps) {
  // A one minute tick is what makes the indicator visibly creep along.
  const tick = useNow(60000);

  const minutes = useMemo(
    () => nowMinutes ?? currentMinutesInKst(),
    // The tick exists purely to re-derive the clock on an interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nowMinutes, tick],
  );

  const advice = useMemo(() => rushAdvice(minutes), [minutes]);
  const isLive = !muted && advice.phase === 'during';
  const current = advice.current;

  const [trackWidth, setTrackWidth] = useState(0);
  const onTrackLayout = (event: LayoutChangeEvent) =>
    setTrackWidth(event.nativeEvent.layout.width);

  // The indicator slides to its new spot rather than jumping on each tick.
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (trackWidth === 0) return;
    Animated.timing(slide, {
      toValue: progressOf(minutes) * trackWidth,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [minutes, trackWidth, slide]);

  // The status block cross-fades when the band changes, so the card reads as
  // something that updates rather than something that was printed.
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [current?.level, advice.phase, fade]);

  const accent = current?.color ?? colors.textSecondary;

  return (
    <View style={[styles.card, shadow.sm, muted ? styles.muted : null]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>🍽️</Text>
          <Text style={[text.subheading, styles.title]}>Lunch Line Live</Text>
        </View>
        {isLive ? <LiveBadge /> : <EstimateChip />}
      </View>

      <Animated.View style={[styles.status, { opacity: fade }]}>
        <View style={[styles.statusStripe, { backgroundColor: accent }]} />
        <View style={styles.statusText}>
          {current ? (
            <Text style={[text.caption, styles.statusEyebrow, { color: accent }]}>
              {current.emoji} {current.status} · {current.label}
            </Text>
          ) : (
            <Text style={[text.caption, styles.statusEyebrow]}>
              {advice.phase === 'before' ? '배식 전' : '배식 종료'}
            </Text>
          )}
          <Text style={[text.subheading, styles.headline]}>{advice.headline}</Text>
          {advice.hint ? <Text style={[text.caption, styles.hint]}>{advice.hint}</Text> : null}
          {isLive ? (
            <Text style={[text.caption, styles.clock]}>
              지금 {formatClock(minutes)} 기준 · 1분마다 갱신
            </Text>
          ) : null}
        </View>
      </Animated.View>

      <View>
        <View
          accessibilityRole="image"
          accessibilityLabel={LUNCH_RUSH_BANDS.map(
            (band) => `${formatClock(band.start)}부터 ${formatClock(band.end)}까지 ${band.label}`,
          ).join(', ')}
          style={styles.bar}
          onLayout={onTrackLayout}
        >
          {LUNCH_RUSH_BANDS.map((band) => {
            const active = isLive && current?.level === band.level;
            return (
              <View
                key={band.level}
                style={[
                  styles.segment,
                  {
                    flex: band.end - band.start,
                    backgroundColor: band.color,
                    opacity: active ? 1 : band.intensity * 0.72,
                  },
                ]}
              />
            );
          })}

          {isLive ? (
            <Animated.View
              style={[
                styles.marker,
                { transform: [{ translateX: slide }] },
                { pointerEvents: 'none' },
              ]}
            >
              <View style={[styles.markerDot, { borderColor: accent }]} />
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.ticks}>
          {[LUNCH_RUSH_START, ...LUNCH_RUSH_BANDS.map((band) => band.end)].map(
            (tickMinutes, index, all) => {
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
            },
          )}
        </View>
      </View>

      {compact ? null : (
        <View style={styles.legend}>
          {LUNCH_RUSH_BANDS.map((band) => (
            <LegendRow
              key={band.level}
              band={band}
              active={isLive && current?.level === band.level}
            />
          ))}
        </View>
      )}

      <Text style={[text.caption, styles.disclaimer]}>ⓘ {RUSH_ESTIMATE_DISCLAIMER}</Text>
    </View>
  );
}

/** A softly pulsing dot, the usual shorthand for "this is updating". */
function LiveBadge() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={[styles.liveBadge, { backgroundColor: colors.dangerSoft }]}>
      <Animated.View
        style={[
          styles.liveDot,
          {
            backgroundColor: colors.danger,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) },
            ],
          },
        ]}
      />
      <Text style={[text.caption, styles.liveText]}>LIVE</Text>
    </View>
  );
}

function EstimateChip() {
  return (
    <View style={styles.estimateChip}>
      <Text style={[text.caption, styles.estimateText]}>예상</Text>
    </View>
  );
}

function LegendRow({ band, active }: { band: RushBand; active: boolean }) {
  const isBest = band.level === BEST_BAND.level;

  return (
    <View style={[styles.legendRow, active ? { backgroundColor: band.soft } : null]}>
      <View style={[styles.legendDot, { backgroundColor: band.color }]} />

      <View style={styles.legendBody}>
        <View style={styles.legendTop}>
          <Text style={[text.bodyStrong, styles.legendTime]}>
            {formatClock(band.start)} – {formatClock(band.end)}
          </Text>
          <Text style={[text.caption, styles.legendStatus, { color: band.color }]}>
            {band.status}
          </Text>
          {isBest ? (
            <View style={styles.bestChip}>
              <Text style={[text.caption, styles.bestChipText]}>Best time to go</Text>
            </View>
          ) : null}
        </View>
        <Text style={[text.caption, styles.legendDetail]}>{band.detail}</Text>
      </View>
    </View>
  );
}

const BAR_HEIGHT = 16;
const TICK_WIDTH = 44;
const MARKER = 16;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
    gap: space(3),
  },
  muted: { opacity: 0.7 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(2) },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  titleEmoji: { fontSize: 16 },
  title: { color: colors.text, letterSpacing: -0.2 },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1.5),
    paddingHorizontal: space(2.5),
    paddingVertical: space(1),
    borderRadius: radius.pill,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { color: colors.danger, fontWeight: '800', letterSpacing: 0.8 },

  estimateChip: {
    paddingHorizontal: space(2.5),
    paddingVertical: space(1),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  estimateText: { color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.4 },

  status: { flexDirection: 'row', gap: space(3), alignItems: 'stretch' },
  statusStripe: { width: 4, borderRadius: radius.pill },
  statusText: { flex: 1, gap: space(0.5) },
  statusEyebrow: { color: colors.textSecondary, fontWeight: '800', letterSpacing: 0.4 },
  headline: { color: colors.text },
  hint: { color: colors.textSecondary },
  clock: { color: colors.textMuted, marginTop: space(0.5) },

  bar: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    overflow: 'visible',
    gap: 2,
  },
  segment: { height: '100%', borderRadius: 3 },
  marker: {
    position: 'absolute',
    top: (BAR_HEIGHT - MARKER) / 2,
    left: -MARKER / 2,
  },
  markerDot: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: colors.white,
    borderWidth: 4,
  },

  ticks: { height: 16, marginTop: space(1.5) },
  tick: {
    position: 'absolute',
    color: colors.textMuted,
    width: TICK_WIDTH,
    marginLeft: -TICK_WIDTH / 2,
    textAlign: 'center',
  },
  tickFirst: { left: 0, marginLeft: 0, textAlign: 'left' },
  tickLast: { right: 0, marginLeft: 0, textAlign: 'right' },

  legend: { gap: space(1) },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space(2.5),
    paddingVertical: space(2),
    paddingHorizontal: space(2),
    borderRadius: radius.md,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  legendBody: { flex: 1, gap: space(0.5) },
  legendTop: { flexDirection: 'row', alignItems: 'center', gap: space(2), flexWrap: 'wrap' },
  legendTime: { color: colors.text },
  legendStatus: { fontWeight: '800', letterSpacing: 0.4 },
  legendDetail: { color: colors.textSecondary },
  bestChip: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: space(2),
    paddingVertical: space(0.5),
    borderRadius: radius.pill,
  },
  bestChipText: { color: colors.accent, fontWeight: '700' },

  disclaimer: { color: colors.textMuted },
});
