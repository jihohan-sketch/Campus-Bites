import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, crowdScale, crowdStepFor, radius, space, type } from '../theme';
import type { CrowdSummary } from '../types';
import { CROWD_TREND_LABEL } from '../services/crowd';
import { formatRelativeTime } from '../utils/date';

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
 * live student reports rather than any single opinion.
 */
export function CrowdMeter({ summary, now }: CrowdMeterProps) {
  const hasData = summary.level !== null;
  const step = crowdStepFor(summary.level ?? 3);
  const filled = hasData ? Math.round(summary.level as number) : 0;

  return (
    <View style={[styles.container, { backgroundColor: hasData ? step.soft : colors.surfaceMuted }]}>
      <View style={styles.headerRow}>
        <View style={styles.headline}>
          <Text style={[type.display, { color: hasData ? step.color : colors.textMuted }]}>
            {hasData ? step.label : '정보 없음'}
          </Text>
          <Text style={[type.body, styles.detail]}>
            {hasData ? step.detail : '첫 제보를 남겨 주세요'}
          </Text>
        </View>

        {hasData ? (
          <View style={styles.trend}>
            <Ionicons name={TREND_ICON[summary.trend]} size={16} color={step.color} />
            <Text style={[type.caption, { color: step.color, fontWeight: '600' }]}>
              {CROWD_TREND_LABEL[summary.trend]}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bars} accessibilityRole="progressbar" accessibilityValue={{ now: filled, min: 0, max: 5 }}>
        {crowdScale.map((entry) => (
          <View
            key={entry.level}
            style={[
              styles.bar,
              {
                backgroundColor:
                  hasData && entry.level <= filled ? step.color : 'rgba(28,25,23,0.10)',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Stat
          icon="time-outline"
          label="예상 대기"
          value={summary.waitMinutes !== null ? `약 ${summary.waitMinutes}분` : '—'}
          color={step.color}
        />
        <Stat
          icon="people-outline"
          label="최근 제보"
          value={`${summary.reportCount}건`}
          color={step.color}
        />
        <Stat
          icon="refresh-outline"
          label="업데이트"
          value={
            summary.freshnessMs !== null
              ? formatRelativeTime(now - summary.freshnessMs, now)
              : '—'
          }
          color={step.color}
        />
      </View>
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
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[type.caption, styles.statLabel]}>{label}</Text>
      <Text style={[type.bodyStrong, styles.statValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.xl, padding: space(5), gap: space(4) },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headline: { flex: 1, gap: space(1) },
  detail: { color: colors.textSecondary },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1),
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: space(2.5),
    paddingVertical: space(1),
    borderRadius: radius.pill,
  },
  bars: { flexDirection: 'row', gap: space(1.5) },
  bar: { flex: 1, height: 8, borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: space(3) },
  stat: { flex: 1, alignItems: 'flex-start', gap: space(0.5) },
  statLabel: { color: colors.textSecondary },
  statValue: { color: colors.text },
});
