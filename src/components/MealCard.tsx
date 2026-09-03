import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, mealTheme, radius, shadow, space, type as text } from '../theme';
import type { Meal, MealType } from '../types';
import { allergenLabel } from '../utils/meal';

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
  const theme = mealTheme[type];
  const dishes = meal?.dishes ?? [];
  const visible = dishes.slice(0, DISH_PREVIEW_LIMIT);
  const hidden = dishes.length - visible.length;
  const interactive = Boolean(meal && onPress);

  return (
    <Pressable
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={`${theme.label} ${meal ? `${dishes.length}개 메뉴` : '급식 없음'}`}
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      style={({ pressed }) => [
        styles.card,
        shadow.sm,
        isCurrent ? { borderColor: theme.tint, borderWidth: 1.5 } : null,
        pressed && interactive ? styles.pressed : null,
      ]}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>{theme.emoji}</Text>
          <View>
            <Text style={[text.heading, styles.headerTitle]}>{theme.label}</Text>
            <Text style={[text.caption, styles.headerWindow]}>{theme.window}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {isCurrent ? (
            <View style={styles.nowBadge}>
              <View style={styles.nowDot} />
              <Text style={[text.caption, styles.nowText]}>NOW</Text>
            </View>
          ) : null}
          {meal && meal.calories !== null ? (
            <Text style={[text.label, styles.calories]}>{Math.round(meal.calories)} kcal</Text>
          ) : null}
        </View>
      </LinearGradient>

      {meal && dishes.length > 0 ? (
        <View style={styles.body}>
          {visible.map((dish, index) => (
            <View key={`${dish.name}-${index}`} style={styles.dishRow}>
              <View style={[styles.bullet, { backgroundColor: theme.tint }]} />
              <View style={styles.dishText}>
                <Text style={[text.body, styles.dishName]}>{dish.name}</Text>
                {dish.allergens.length > 0 ? (
                  <Text style={[text.caption, styles.allergens]} numberOfLines={1}>
                    {dish.allergens.map(allergenLabel).join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {hidden > 0 ? (
            <Text style={[text.caption, styles.more]}>외 {hidden}가지 더</Text>
          ) : null}

          <View style={styles.footer}>
            {meal.headcount !== null ? (
              <Text style={[text.caption, styles.footerText]}>
                {meal.headcount.toLocaleString('ko-KR')}인분 준비
              </Text>
            ) : (
              <View />
            )}
            {interactive ? (
              <View style={styles.detailLink}>
                <Text style={[text.caption, { color: theme.tint, fontWeight: '600' }]}>
                  영양 · 원산지
                </Text>
                <Ionicons name="chevron-forward" size={12} color={theme.tint} />
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.emptyBody}>
          <Text style={[text.body, styles.emptyText]}>이 시간의 급식은 없어요</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space(4),
    paddingVertical: space(3.5),
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  headerEmoji: { fontSize: 26 },
  headerTitle: { color: colors.white },
  headerWindow: { color: 'rgba(255,255,255,0.85)' },
  headerRight: { alignItems: 'flex-end', gap: space(1) },
  calories: { color: colors.white },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(1),
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: space(2),
    paddingVertical: space(0.5),
    borderRadius: radius.pill,
  },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  nowText: { color: colors.white, fontWeight: '700', letterSpacing: 0.5 },
  body: { paddingHorizontal: space(4), paddingVertical: space(3.5), gap: space(2.5) },
  dishRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(2.5) },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  dishText: { flex: 1, gap: space(0.5) },
  dishName: { color: colors.text },
  allergens: { color: colors.textMuted },
  more: { color: colors.textSecondary, paddingLeft: space(4.5) },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space(1),
    paddingTop: space(3),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { color: colors.textMuted },
  detailLink: { flexDirection: 'row', alignItems: 'center', gap: space(1) },
  emptyBody: { paddingHorizontal: space(4), paddingVertical: space(6), alignItems: 'center' },
  emptyText: { color: colors.textMuted },
});
