import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import type { CrowdSummary } from '../types';
import { CROWD_TREND_LABEL } from '../services/crowd';
import { formatRelativeTime } from '../utils/date';
import { Pulse, useAnimatedTo } from './motion';

interface CrowdMeterProps {
  summary: CrowdSummary;
  now: number;
}

const TREND_ICON: Record<CrowdSummary['trend'], keyof typeof Ionicons.glyphMap> = {
  rising: 'trending-up',
  falling: 'trending-down',
  steady: 'remove',
  unknown: 'help-circle-outline',
};

/**
 * The headline "how busy is the cafeteria right now" reading, built from the
 * live student reports rather than any single opinion. Colour carries the
 * answer; the pulse at level 5 is what makes it read as urgent at a glance.
 */
export function CrowdMeter({ summary, now }: CrowdMeterProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const hasData = summary.level !== null;
  const step = t.crowdStep(summary.level ?? 3);
  const filled = hasData ? Math.round(summary.level as number) : 0;
  const isPacked = hasData && filled >= 5;
  const accent = hasData ? step.color : t.colors.textMuted;
  const isCalm = hasData && filled <= 2;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: hasData ? step.soft : t.colors.surfaceMuted,
          borderColor: hasData ? step.color : t.colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headline}>
          <View style={styles.labelRow}>
            {hasData ? (
              <Pulse active={isPacked} duration={780} scaleTo={1.6} minOpacity={0.25}>
                <View style={[styles.statusDot, { backgroundColor: step.color }]} />
              </Pulse>
            ) : null}
            <Text style={[text.display, { color: hasData ? step.color : t.colors.textMuted }]}>
              {hasData ? step.label : '정보 없음'}
            </Text>
          </View>
          <Text style={[text.body, styles.detail]}>
            {hasData ? step.detail : '첫 제보를 남겨 주세요'}
          </Text>
        </View>

        {hasData ? (
          <View style={[styles.trend, { borderColor: step.color }]}>
            <Ionicons name={TREND_ICON[summary.trend]} size={14} color={step.color} />
            <Text style={[text.caption, { color: step.color, fontWeight: '700' }]}>
              {CROWD_TREND_LABEL[summary.trend]}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={styles.bars}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: filled, min: 0, max: 5 }}
      >
        {t.crowd.map((entry, index) => (
          <Bar
            key={entry.level}
            index={index}
            active={hasData && entry.level <= filled}
            color={step.color}
            idle={t.colors.track}
            pulse={isPacked}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Stat
          icon="time-outline"
          label="예상 대기"
          value={summary.waitMinutes !== null ? `약 ${summary.waitMinutes}분` : '—'}
          color={accent}
        />
        <Stat
          icon="people-outline"
          label="최근 제보"
          value={`${summary.reportCount}건`}
          color={accent}
        />
        <Stat
          icon="refresh-outline"
          label="업데이트"
          value={
            summary.freshnessMs !== null ? formatRelativeTime(now - summary.freshnessMs, now) : '—'
          }
          color={accent}
        />
      </View>

      {isCalm ? (
        <Text style={[text.caption, { color: step.color, fontWeight: '700' }]}>
          ✓ 지금이 가기 좋은 타이밍이에요
        </Text>
      ) : null}
    </View>
  );
}

/** One of the five segments; fills in sequence rather than all at once. */
function Bar({
  index,
  active,
  color,
  idle,
  pulse,
}: {
  index: number;
  active: boolean;
  color: string;
  idle: string;
  pulse: boolean;
}) {
  const styles = useStyles(makeStyles);
  const grow = useAnimatedTo(active ? 1 : 0, 320 + index * 70);

  return (
    <View style={[styles.bar, { backgroundColor: idle }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.barFill,
          { backgroundColor: color, opacity: grow },
        ]}
      />
      {active && pulse ? (
        <Pulse duration={820} scaleTo={1} minOpacity={0.25} style={StyleSheet.absoluteFill}>
          <View style={[styles.barFill, StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
        </Pulse>
      ) : null}
    </View>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={[text.caption, styles.statLabel]}>{label}</Text>
      </View>
      <Text style={[text.bodyStrong, styles.statValue]}>{value}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      borderRadius: radius.xl,
      padding: space(5),
      gap: space(4),
      borderWidth: StyleSheet.hairlineWidth,
    },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space(3) },
    headline: { flex: 1, gap: space(1) },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    detail: { color: t.colors.textSecondary },
    trend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1),
      paddingHorizontal: space(2.5),
      paddingVertical: space(1),
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },

    bars: { flexDirection: 'row', gap: space(1.5) },
    bar: { flex: 1, height: 9, borderRadius: 5, overflow: 'hidden' },
    barFill: { borderRadius: 5 },

    footer: { flexDirection: 'row', justifyContent: 'space-between', gap: space(3) },
    stat: { flex: 1, alignItems: 'flex-start', gap: space(1) },
    statTop: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
    statLabel: { color: t.colors.textSecondary },
    statValue: { color: t.colors.text, fontVariant: ['tabular-nums'] },
  });
