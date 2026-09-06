import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import type { Meal, MealType } from '../types';
import { foodEmoji } from '../utils/foodIcon';
import { allergenLabel } from '../utils/meal';
import { Pulse, PressableScale } from './motion';

interface MealCardProps {
  type: MealType;
  meal: Meal | null;
  onPress?: () => void;
  /** Highlights the service that is happening around now. */
  isCurrent?: boolean;
}

/** How many dishes to show before collapsing the rest into a "+n" row. */
const DISH_PREVIEW_LIMIT = 7;

export function MealCard({ type, meal, onPress, isCurrent = false }: MealCardProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const theme = t.meal[type];

  const dishes = meal?.dishes ?? [];
  const visible = dishes.slice(0, DISH_PREVIEW_LIMIT);
  const hidden = dishes.length - visible.length;
  const interactive = Boolean(meal && onPress);

  return (
    <PressableScale
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={`${theme.label} ${meal ? `${dishes.length}개 메뉴` : '급식 없음'}`}
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      scaleTo={0.985}
      style={[
        styles.card,
        t.shadow.md,
        isCurrent ? { borderColor: theme.tint, borderWidth: 1.5 } : null,
      ]}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* A light sweep across the top of the band keeps the gradient from
            reading as a flat printed rectangle. */}
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: theme.inkWash, borderColor: theme.inkWashBorder },
            ]}
          >
            <Text style={styles.headerEmoji}>{theme.emoji}</Text>
          </View>
          <View style={styles.headerTitles}>
            <Text style={[text.heading, { color: theme.ink }]}>{theme.label}</Text>
            <Text style={[text.caption, styles.tabular, { color: theme.inkMuted }]}>
              {theme.window}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {isCurrent ? (
            <View style={[styles.nowBadge, { backgroundColor: theme.inkWash }]}>
              <Pulse duration={900} scaleTo={1.5} minOpacity={0.35}>
                <View style={[styles.nowDot, { backgroundColor: theme.ink }]} />
              </Pulse>
              <Text style={[text.overline, { color: theme.ink }]}>NOW</Text>
            </View>
          ) : null}
          {meal && meal.calories !== null ? (
            <Text style={[text.label, styles.tabular, { color: theme.ink }]}>
              {Math.round(meal.calories)} kcal
            </Text>
          ) : null}
        </View>
      </LinearGradient>

      {meal && dishes.length > 0 ? (
        <View style={styles.body}>
          {visible.map((dish, index) => (
            <View key={`${dish.name}-${index}`} style={styles.dishRow}>
              <View style={[styles.dishIcon, { backgroundColor: theme.soft }]}>
                <Text style={styles.dishEmoji}>{foodEmoji(dish.name)}</Text>
              </View>
              <View style={styles.dishText}>
                <Text style={[text.bodyStrong, styles.dishName]}>{dish.name}</Text>
                {dish.allergens.length > 0 ? (
                  <Text style={[text.caption, styles.allergens]} numberOfLines={1}>
                    {dish.allergens.map(allergenLabel).join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {hidden > 0 ? <Text style={[text.caption, styles.more]}>외 {hidden}가지 더</Text> : null}

          <View style={styles.footer}>
            {meal.headcount !== null ? (
              <Text style={[text.caption, styles.footerText]}>
                {meal.headcount.toLocaleString('ko-KR')}인분 준비
              </Text>
            ) : (
              <View />
            )}
            {interactive ? (
              // The bundled 식단표 carries dish names and allergen codes and
              // nothing else — no nutrition table, no 원산지 — so the label
              // names what the detail page actually shows. If a data source
              // with those fields is ever wired up, `Meal.nutrition` and
              // `Meal.origins` already render there and this can go back.
              <View style={[styles.detailLink, { backgroundColor: theme.soft }]}>
                <Text style={[text.caption, { color: theme.tint, fontWeight: '700' }]}>
                  자세히 보기
                </Text>
                <Ionicons name="chevron-forward" size={11} color={theme.tint} />
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.emptyBody}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={[text.body, styles.emptyText]}>이 시간의 급식은 없어요</Text>
        </View>
      )}
    </PressableScale>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space(4),
      paddingVertical: space(4),
      gap: space(3),
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: space(3), flex: 1, zIndex: 1 },
    headerBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
    },
    headerEmoji: { fontSize: 24 },
    headerTitles: { gap: 1 },
    tabular: { fontVariant: ['tabular-nums'] },
    headerRight: { alignItems: 'flex-end', gap: space(1.5), zIndex: 1 },
    nowBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1.5),
      paddingHorizontal: space(2),
      paddingVertical: space(1),
      borderRadius: radius.pill,
    },
    nowDot: { width: 6, height: 6, borderRadius: 3 },

    body: { paddingHorizontal: space(4), paddingVertical: space(4), gap: space(3) },
    dishRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    dishIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dishEmoji: { fontSize: 16 },
    dishText: { flex: 1, gap: 1 },
    dishName: { color: t.colors.text },
    allergens: { color: t.colors.textMuted },
    more: { color: t.colors.textSecondary, paddingLeft: space(11), marginTop: -space(1) },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: space(1),
      paddingTop: space(3.5),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.divider,
    },
    footerText: { color: t.colors.textMuted, fontVariant: ['tabular-nums'] },
    detailLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1),
      paddingHorizontal: space(2.5),
      paddingVertical: space(1.5),
      borderRadius: radius.pill,
    },

    emptyBody: {
      paddingHorizontal: space(4),
      paddingVertical: space(7),
      alignItems: 'center',
      gap: space(2),
    },
    emptyEmoji: { fontSize: 26, opacity: 0.5 },
    emptyText: { color: t.colors.textMuted },
  });
