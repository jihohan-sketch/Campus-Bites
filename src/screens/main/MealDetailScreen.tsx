import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { CONTENT_MAX_WIDTH, Screen } from '../../components/Screen';
import { FadeIn } from '../../components/motion';
import { MENU_DISCLAIMER } from '../../config/school';
import type { RootStackParamList } from '../../navigation/types';
import {
  onPhoto,
  radius,
  space,
  type as text,
  useStyles,
  useTheme,
  type Theme,
} from '../../theme';
import { DishImage } from '../../components/DishImage';
import { fromYmd, formatLongKoreanDate } from '../../utils/date';
import { headlineDish } from '../../utils/foodIcon';
import { allergenLabel, collectAllergens } from '../../utils/meal';
import { englishDishName } from '../../utils/dishEnglish';

type Props = NativeStackScreenProps<RootStackParamList, 'MealDetail'>;

export function MealDetailScreen({ route }: Props) {
  const { meal } = route.params;
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const theme = t.meal[meal.type];
  const { width } = useWindowDimensions();
  const civilDate = useMemo(() => fromYmd(meal.date), [meal.date]);
  const allergens = useMemo(() => collectAllergens(meal.dishes), [meal.dishes]);
  const headline = useMemo(() => headlineDish(meal.dishes), [meal.dishes]);
  // The hero is the one picture on the page worth looking at properly, so it
  // takes the full width of the column and as much height as the window can
  // spare rather than sitting in a fixed thumbnail.
  const heroHeight = Math.round(
    Math.max(230, Math.min(330, Math.min(width, CONTENT_MAX_WIDTH) * 0.72)),
  );

  return (
    <Screen topInset={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: heroHeight }]}>
          {headline ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <DishImage
                name={headline.name}
                width="100%"
                height={heroHeight}
                tint={theme.soft}
                round={0}
              />
            </View>
          ) : (
            <LinearGradient
              colors={theme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          <LinearGradient
            colors={theme.scrim}
            locations={[0, 0.4, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.heroBody}>
            <View style={styles.serviceChip}>
              <Text style={styles.serviceEmoji}>{theme.emoji}</Text>
              <Text style={[text.overline, styles.onPhoto]}>{theme.korean}</Text>
            </View>

            {/* The service is named in English everywhere in the app — the tab
                that got the student here, the chip on the card — so the title
                here is the same word, with the Korean on the chip above it. */}
            <Text style={[text.display, styles.heroTitle]}>{theme.label}</Text>
            <Text style={[text.caption, styles.heroSubtitle]}>
              {civilDate ? formatLongKoreanDate(civilDate) : meal.date} · {theme.window}
            </Text>

            <View style={styles.heroStats}>
              {meal.calories !== null ? (
                <HeroStat
                  icon="flame-outline"
                  label={`${Math.round(meal.calories)} kcal`}
                />
              ) : null}
              {meal.headcount !== null ? (
                <HeroStat
                  icon="people-outline"
                  label={`${meal.headcount.toLocaleString('ko-KR')}명`}
                />
              ) : null}
              <HeroStat icon="restaurant-outline" label={`메뉴 ${meal.dishes.length}가지`} />
            </View>
          </View>
        </View>

        <Section title="오늘 나오는 메뉴" index={0}>
          <Card padded={false}>
            {meal.dishes.map((dish, index) => (
              <View
                key={`${dish.name}-${index}`}
                style={[styles.dishRow, index > 0 ? styles.dishRowDivided : null]}
              >
                <DishImage name={dish.name} size={64} tint={theme.soft} round={radius.md} />
                <View style={styles.dishText}>
                  <Text style={[text.bodyStrong, styles.dishName]}>{dish.name}</Text>
                  {englishDishName(dish.name) ? (
                    <Text style={[text.caption, styles.dishNameEn]}>
                      {englishDishName(dish.name)}
                    </Text>
                  ) : null}
                  {dish.allergens.length > 0 ? (
                    <View style={styles.dishAllergens}>
                      {dish.allergens.map((code) => (
                        <Pill
                          key={code}
                          label={allergenLabel(code)}
                          color={theme.tint}
                          background={theme.soft}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </Card>
        </Section>

        {allergens.length > 0 ? (
          <Section title="알레르기 유발 식품" index={1}>
            <View style={styles.allergenWrap}>
              {allergens.map((code) => (
                <Pill key={code} label={`${code}. ${allergenLabel(code)}`} />
              ))}
            </View>
          </Section>
        ) : null}

        {meal.nutrition.length > 0 ? (
          <Section title="영양 정보" index={2}>
            <Card padded={false} style={styles.infoCard}>
              {meal.nutrition.map((pair, index) => (
                <InfoRow key={pair.label} label={pair.label} value={pair.value} divided={index > 0} />
              ))}
            </Card>
          </Section>
        ) : null}

        {meal.origins.length > 0 ? (
          <Section title="원산지" index={3}>
            <Card padded={false} style={styles.infoCard}>
              {meal.origins.map((pair, index) => (
                <InfoRow key={pair.label} label={pair.label} value={pair.value} divided={index > 0} />
              ))}
            </Card>
          </Section>
        ) : null}

        {allergens.length === 0 ? (
          <Text style={[text.caption, styles.source]}>
            이 식사에는 알레르기 정보가 등록되어 있지 않아요. 알레르기가 있다면 급식실에 직접
            확인해 주세요.
          </Text>
        ) : null}

        <Text style={[text.caption, styles.source]}>※ {MENU_DISCLAIMER}</Text>
        <Text style={[text.caption, styles.source]}>자료 출처: {meal.schoolName} 식단표</Text>
      </ScrollView>
    </Screen>
  );
}

/** One frosted stat on the hero scrim — calories, headcount, dish count. */
function HeroStat({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.heroStat}>
      <Ionicons name={icon} size={13} color={onPhoto.ink} />
      <Text style={[text.caption, styles.heroStatLabel]}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  index,
  children,
}: {
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  const styles = useStyles(makeStyles);

  return (
    <FadeIn index={index}>
      <View style={styles.section}>
        <Text style={[text.overline, styles.sectionTitle]}>{title}</Text>
        {children}
      </View>
    </FadeIn>
  );
}

function InfoRow({ label, value, divided }: { label: string; value: string; divided: boolean }) {
  const styles = useStyles(makeStyles);

  return (
    <View style={[styles.infoRow, divided ? styles.infoRowDivided : null]}>
      <Text style={[text.body, styles.infoLabel]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[text.bodyStrong, styles.infoValue]}>{value}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    content: { paddingBottom: space(14), gap: space(5) },

    hero: {
      justifyContent: 'flex-end',
      borderBottomLeftRadius: radius.xxl,
      borderBottomRightRadius: radius.xxl,
      overflow: 'hidden',
    },
    heroBody: { paddingHorizontal: space(5.5), paddingBottom: space(5.5), gap: space(1) },
    serviceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: space(1.5),
      paddingHorizontal: space(2.5),
      paddingVertical: space(1.5),
      borderRadius: radius.pill,
      backgroundColor: onPhoto.wash,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: onPhoto.washBorder,
      marginBottom: space(2),
    },
    serviceEmoji: { fontSize: 13 },
    onPhoto: { color: onPhoto.ink },
    heroTitle: {
      color: onPhoto.ink,
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 8,
    },
    heroSubtitle: { color: onPhoto.inkMuted },

    heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginTop: space(3.5) },
    heroStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(1.5),
      paddingHorizontal: space(3),
      paddingVertical: space(1.5),
      borderRadius: radius.pill,
      backgroundColor: onPhoto.wash,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: onPhoto.washBorder,
    },
    heroStatLabel: { color: onPhoto.ink, fontWeight: '700', fontVariant: ['tabular-nums'] },

    section: { paddingHorizontal: space(5), gap: space(2.5) },
    sectionTitle: { color: t.colors.textSecondary, paddingLeft: space(0.5) },

    dishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3.5),
      paddingVertical: space(3.5),
      paddingHorizontal: space(4.5),
    },
    dishRowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.divider },
    dishText: { flex: 1, gap: space(1.5) },
    dishName: { color: t.colors.text },
    dishNameEn: { color: t.colors.textSecondary },
    dishAllergens: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1.5) },

    allergenWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space(2),
      backgroundColor: t.colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: space(4.5),
    },

    infoCard: { paddingHorizontal: space(4.5) },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space(4),
      paddingVertical: space(3),
    },
    infoRowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.divider },
    infoLabel: { color: t.colors.textSecondary, flex: 1 },
    infoValue: { color: t.colors.text, textAlign: 'right' },

    source: { color: t.colors.textMuted, paddingHorizontal: space(5), marginTop: space(1) },
  });
