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
  rushAdvice,
  type RushBand,
} from '../config/lunchRush';
import { useNow } from '../hooks/useNow';
import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import { currentMinutesInKst } from '../utils/date';
import { Pulse, USE_NATIVE_DRIVER } from './motion';

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
  const t = useTheme();
  const styles = useStyles(makeStyles);

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
  const currentTheme = current ? t.rush[current.level] : null;

  const [trackWidth, setTrackWidth] = useState(0);
  const onTrackLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

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

  const accent = currentTheme?.color ?? t.colors.textSecondary;

  return (
    <View style={[styles.card, t.shadow.sm, muted ? styles.muted : null]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleEmoji}>🍽️</Text>
          <Text style={[text.subheading, styles.title]}>Lunch Line Live</Text>
        </View>
        {isLive ? <LiveBadge /> : <EstimateChip />}
      </View>

      <Animated.View
        style={[
          styles.status,
          { opacity: fade, backgroundColor: currentTheme?.soft ?? t.colors.surfaceMuted },
        ]}
      >
        <View style={[styles.statusStripe, { backgroundColor: accent }]} />
        <View style={styles.statusText}>
          {current ? (
            <View style={styles.statusEyebrowRow}>
              <Pulse
                active={isLive && Boolean(currentTheme?.pulse)}
                duration={760}
                scaleTo={1.5}
                minOpacity={0.3}
              >
                <View style={[styles.statusDot, { backgroundColor: accent }]} />
              </Pulse>
              <Text style={[text.overline, { color: accent }]}>
                {current.status} · {current.label}
              </Text>
            </View>
          ) : (
            <Text style={[text.overline, styles.statusEyebrow]}>
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
            const bandTheme = t.rush[band.level];
            const active = isLive && current?.level === band.level;
            return (
              <View
                key={band.level}
                style={[
                  styles.segment,
                  {
                    flex: band.end - band.start,
                    backgroundColor: bandTheme.color,
                    opacity: active ? 1 : bandTheme.intensity * 0.5,
                  },
                ]}
              />
            );
          })}

          {isLive ? (
            <Animated.View
              style={[styles.marker, { transform: [{ translateX: slide }] }, { pointerEvents: 'none' }]}
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
            <LegendRow key={band.level} band={band} active={isLive && current?.level === band.level} />
          ))}
        </View>
      )}

      <Text style={[text.caption, styles.disclaimer]}>ⓘ {RUSH_ESTIMATE_DISCLAIMER}</Text>
    </View>
  );
}

/** A softly pulsing dot, the usual shorthand for "this is updating". */
function LiveBadge() {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  return (
    <View style={[styles.liveBadge, { backgroundColor: t.colors.dangerSoft }]}>
      <Pulse duration={900} scaleTo={1.5} minOpacity={0.35}>
        <View style={[styles.liveDot, { backgroundColor: t.colors.danger }]} />
      </Pulse>
      <Text style={[text.overline, { color: t.colors.danger }]}>LIVE</Text>
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
              <Text style={[text.caption, styles.bestChipText]}>Best time to go</Text>
            </View>
          ) : null}
        </View>
        <Text style={[text.caption, styles.legendDetail]}>{band.detail}</Text>
      </View>
    </View>
  );
}

const BAR_HEIGHT = 14;
const TICK_WIDTH = 44;
const MARKER = 18;

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

    status: {
      flexDirection: 'row',
      gap: space(3),
      alignItems: 'stretch',
      borderRadius: radius.md,
      padding: space(3.5),
    },
    statusStripe: { width: 4, borderRadius: radius.pill },
    statusText: { flex: 1, gap: space(1) },
    statusEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusEyebrow: { color: t.colors.textSecondary },
    headline: { color: t.colors.text },
    hint: { color: t.colors.textSecondary },
    clock: { color: t.colors.textMuted, fontVariant: ['tabular-nums'] },

    bar: {
      flexDirection: 'row',
      height: BAR_HEIGHT,
      borderRadius: radius.pill,
      overflow: 'visible',
      gap: 3,
    },
    segment: { height: '100%', borderRadius: 4 },
    marker: { position: 'absolute', top: (BAR_HEIGHT - MARKER) / 2, left: -MARKER / 2 },
    markerDot: {
      width: MARKER,
      height: MARKER,
      borderRadius: MARKER / 2,
      backgroundColor: t.colors.surface,
      borderWidth: 4,
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

    disclaimer: { color: t.colors.textMuted },
  });
