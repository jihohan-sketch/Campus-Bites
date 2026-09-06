import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { onPhoto, radius, space, type as text, useStyles, useTheme, type Theme } from '../theme';
import type { Meal, MealType } from '../types';
import { headlineDish } from '../utils/foodIcon';
import { allergenLabel } from '../utils/meal';
import { englishDishName } from '../utils/dishEnglish';
import { CONTENT_MAX_WIDTH } from './Screen';
import { DishImage } from './DishImage';
import { Pulse, PressableScale } from './motion';

interface MealCardProps {
  type: MealType;
  meal: Meal | null;
  onPress?: () => void;
  /** Highlights the service that is happening around now. */
  isCurrent?: boolean;
}

/** How many dishes to show before collapsing the rest into a "+n" row. */
const DISH_PREVIEW_LIMIT = 6;

/**
 * Thumbnails grow a little once there is room for them — a phone keeps the
 * compact row, a tablet or a desktop browser gets a picture worth looking at.
 */
const NARROW_MAX = 400;

/** The page gutter either side of the card, so the hero can size itself. */
const PAGE_GUTTER = space(10);

/**
 * The hero photo's share of the card width. A little taller than 16:9 —
 * enough room for the dish name and the chips to sit in the dark half of the
 * scrim without crowding the food.
 */
const HERO_RATIO = 0.66;
const HERO_MIN = 190;
const HERO_MAX = 280;

/**
 * One meal service, as a card.
 *
 * The headline dish gets a photograph the size of the card rather than a
 * 46pt thumbnail, because that picture is the answer to the only question the
 * student opened the app to ask. Everything else — which service this is, when
 * it is served, what it costs in calories — rides on the scrim over that photo,
 * so the top of the card is one image instead of a header band plus a list.
 */
export function MealCard({ type, meal, onPress, isCurrent = false }: MealCardProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const theme = t.meal[type];
  const { width } = useWindowDimensions();

  const compact = width <= NARROW_MAX;
  const thumbSize = compact ? 56 : 64;
  const cardWidth = Math.min(width, CONTENT_MAX_WIDTH) - PAGE_GUTTER;
  const heroHeight = Math.round(
    Math.max(HERO_MIN, Math.min(HERO_MAX, cardWidth * HERO_RATIO)),
  );

  const dishes = meal?.dishes ?? [];
  const visible = dishes.slice(0, DISH_PREVIEW_LIMIT);
  const hidden = dishes.length - visible.length;
  const interactive = Boolean(meal && onPress);
  // The main dish carries the card at a glance, so its photo — not a meal-type
  // emoji — is what fills the hero.
  const headline = headlineDish(dishes);
  const headlineEn = headline ? englishDishName(headline.name) : '';

  return (
    <PressableScale
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={`${theme.label} ${meal ? `메뉴 ${dishes.length}개` : '급식 없음'}`}
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      scaleTo={0.985}
      style={[styles.card, t.shadow.lg]}
    >
      {headline ? (
        <View style={[styles.hero, { height: heroHeight }]}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <DishImage
              name={headline.name}
              width="100%"
              height={heroHeight}
              tint={theme.soft}
              round={0}
            />
          </View>

          {/* Clear over the food, dark under the type. */}
          <LinearGradient
            colors={theme.scrim}
            locations={[0, 0.4, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.heroTop}>
            <View style={styles.serviceChip}>
              <Text style={styles.serviceEmoji}>{theme.emoji}</Text>
              <Text style={[text.overline, styles.onPhoto]}>{theme.label.toUpperCase()}</Text>
            </View>

            {isCurrent ? (
              <View style={styles.nowBadge}>
                <Pulse duration={900} scaleTo={1.5} minOpacity={0.35}>
                  <View style={styles.nowDot} />
                </Pulse>
                <Text style={[text.overline, styles.nowText]}>NOW SERVING</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroBottom}>
            <Text style={[text.title, styles.heroName]} numberOfLines={2}>
              {headline.name}
            </Text>
            {headlineEn ? (
              <Text style={[text.caption, styles.heroNameEn]} numberOfLines={1}>
                {headlineEn}
              </Text>
            ) : null}

            <View style={styles.heroMeta}>
              <MetaChip icon="time-outline" label={theme.window} />
              {meal && meal.calories !== null ? (
                <MetaChip icon="flame-outline" label={`${Math.round(meal.calories)} kcal`} />
              ) : null}
              <MetaChip icon="restaurant-outline" label={`${dishes.length}가지`} />
            </View>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBlank, { height: Math.round(heroHeight * 0.62) }]}
        >
          <View style={[styles.blankBadge, { backgroundColor: theme.inkWash }]}>
            <Text style={styles.blankEmoji}>{theme.emoji}</Text>
          </View>
          <Text style={[text.heading, { color: theme.ink }]}>{theme.label}</Text>
          <Text style={[text.caption, { color: theme.inkMuted }]}>{theme.window}</Text>
        </LinearGradient>
      )}

      {meal && dishes.length > 0 ? (
        <View style={styles.body}>
          <View style={styles.bodyHeader}>
            <Text style={[text.overline, styles.bodyTitle]}>ON THE TRAY</Text>
            <Text style={[text.overline, styles.bodyCount]}>오늘의 구성</Text>
          </View>

          {visible.map((dish, index) => (
            <View key={`${dish.name}-${index}`} style={styles.dishRow}>
              <DishImage name={dish.name} size={thumbSize} tint={theme.soft} round={radius.md} />
              <View style={styles.dishText}>
                <Text style={[text.bodyStrong, styles.dishName]}>{dish.name}</Text>
                {/* VIS is an international school, so the English name sits
                    under every dish rather than behind a language switch. */}
                {englishDishName(dish.name) ? (
                  <Text style={[text.caption, styles.dishNameEn]} numberOfLines={1}>
                    {englishDishName(dish.name)}
                  </Text>
                ) : null}
                {dish.allergens.length > 0 ? (
                  <Text style={[text.caption, styles.allergens]} numberOfLines={1}>
                    {dish.allergens.map(allergenLabel).join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {hidden > 0 ? (
            <View style={[styles.moreRow, { paddingLeft: thumbSize + space(3.5) }]}>
              <Text style={[text.caption, styles.more]}>메뉴 {hidden}개 더 있어요</Text>
            </View>
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
              // The bundled 식단표 carries dish names and allergen codes and
              // nothing else — no nutrition table, no 원산지 — so the label
              // names what the detail page actually shows. If a data source
              // with those fields is ever wired up, `Meal.nutrition` and
              // `Meal.origins` already render there and this can go back.
              <View style={[styles.detailLink, { backgroundColor: theme.soft }]}>
                <Text style={[text.label, { color: theme.tint }]}>전체 메뉴 보기</Text>
                <Ionicons name="arrow-forward" size={13} color={theme.tint} />
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.emptyBody}>
          <Text style={[text.subheading, styles.emptyTitle]}>이 시간에는 급식이 없어요</Text>
          <Text style={[text.caption, styles.emptyText]}>
            다른 시간대를 골라 메뉴를 확인해 보세요.
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

/** One frosted stat on the scrim — time, calories, dish count. */
function MetaChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={12} color={onPhoto.ink} />
      <Text style={[text.caption, styles.metaLabel]}>{label}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.hero,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },

    /* ------------------------------------------------------------- hero */
    hero: { justifyContent: 'space-between' },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space(4),
      paddingTop: space(4),
      gap: space(2),
    },
    serviceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1.5),
      paddingHorizontal: space(2.5),
      paddingVertical: space(1.5),
      borderRadius: radius.pill,
      backgroundColor: onPhoto.wash,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: onPhoto.washBorder,
    },
    serviceEmoji: { fontSize: 13 },
    onPhoto: { color: onPhoto.ink },

    nowBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1.5),
      paddingHorizontal: space(2.5),
      paddingVertical: space(1.5),
      borderRadius: radius.pill,
      backgroundColor: onPhoto.liveFill,
    },
    nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E8451F' },
    nowText: { color: onPhoto.liveInk },

    heroBottom: { paddingHorizontal: space(4.5), paddingBottom: space(4.5), gap: space(0.5) },
    heroName: {
      color: onPhoto.ink,
      // Generated photography has no guaranteed dark patch under the type, so
      // the scrim gets a little help.
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 8,
    },
    heroNameEn: { color: onPhoto.inkMuted },
    heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1.5), marginTop: space(2.5) },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1),
      paddingHorizontal: space(2.5),
      paddingVertical: space(1.25),
      borderRadius: radius.pill,
      backgroundColor: onPhoto.wash,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: onPhoto.washBorder,
    },
    metaLabel: { color: onPhoto.ink, fontWeight: '700', fontVariant: ['tabular-nums'] },

    /* ------------------------------------------------------- empty hero */
    heroBlank: { alignItems: 'center', justifyContent: 'center', gap: space(1) },
    blankBadge: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space(1),
    },
    blankEmoji: { fontSize: 26 },

    /* ------------------------------------------------------------- body */
    body: { paddingHorizontal: space(4.5), paddingVertical: space(4.5), gap: space(3.5) },
    bodyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: -space(0.5),
    },
    bodyTitle: { color: t.colors.textSecondary },
    bodyCount: { color: t.colors.textMuted, letterSpacing: 0 },

    dishRow: { flexDirection: 'row', alignItems: 'center', gap: space(3.5) },
    dishText: { flex: 1, gap: 1 },
    dishName: { color: t.colors.text },
    dishNameEn: { color: t.colors.textSecondary },
    allergens: { color: t.colors.textMuted },
    moreRow: { marginTop: -space(1) },
    more: { color: t.colors.textSecondary, fontWeight: '600' },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: space(1),
      paddingTop: space(4),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.divider,
    },
    footerText: { color: t.colors.textMuted, fontVariant: ['tabular-nums'] },
    detailLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1.5),
      paddingHorizontal: space(3.5),
      paddingVertical: space(2),
      borderRadius: radius.pill,
    },

    emptyBody: {
      paddingHorizontal: space(6),
      paddingVertical: space(7),
      alignItems: 'center',
      gap: space(1.5),
    },
    emptyTitle: { color: t.colors.text },
    emptyText: { color: t.colors.textMuted, textAlign: 'center' },
  });
