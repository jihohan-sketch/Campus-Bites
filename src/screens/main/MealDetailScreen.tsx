import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { Screen } from '../../components/Screen';
import { FadeIn } from '../../components/motion';
import { MENU_DISCLAIMER } from '../../config/school';
import type { RootStackParamList } from '../../navigation/types';
import {
  radius,
  space,
  type as text,
  useStyles,
  useTheme,
  type MealTheme,
  type Theme,
} from '../../theme';
import { fromYmd, formatLongKoreanDate } from '../../utils/date';
import { foodEmoji } from '../../utils/foodIcon';
import { allergenLabel, collectAllergens } from '../../utils/meal';

type Props = NativeStackScreenProps<RootStackParamList, 'MealDetail'>;

export function MealDetailScreen({ route }: Props) {
  const { meal } = route.params;
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const theme = t.meal[meal.type];
  const civilDate = useMemo(() => fromYmd(meal.date), [meal.date]);
  const allergens = useMemo(() => collectAllergens(meal.dishes), [meal.dishes]);

  return (
    <Screen topInset={false}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View
            style={[
              styles.heroBadge,
              { backgroundColor: theme.inkWash, borderColor: theme.inkWashBorder },
            ]}
          >
            <Text style={styles.heroEmoji}>{theme.emoji}</Text>
          </View>
          <Text style={[text.display, { color: theme.ink }]}>{theme.label}</Text>
          <Text style={[text.caption, { color: theme.inkMuted }]}>
            {civilDate ? formatLongKoreanDate(civilDate) : meal.date} · {theme.window}
          </Text>

          <View style={styles.heroStats}>
            {meal.calories !== null ? (
              <HeroStat label="열량" value={`${Math.round(meal.calories)} kcal`} theme={theme} />
            ) : null}
            {meal.headcount !== null ? (
              <HeroStat
                label="식수 인원"
                value={`${meal.headcount.toLocaleString('ko-KR')}명`}
                theme={theme}
              />
            ) : null}
            <HeroStat label="메뉴" value={`${meal.dishes.length}가지`} theme={theme} />
          </View>
        </LinearGradient>

        <Section title="오늘의 메뉴" index={0}>
          <Card padded={false}>
            {meal.dishes.map((dish, index) => (
              <View
                key={`${dish.name}-${index}`}
                style={[styles.dishRow, index > 0 ? styles.dishRowDivided : null]}
              >
                <View style={[styles.dishIcon, { backgroundColor: theme.soft }]}>
                  <Text style={styles.dishEmoji}>{foodEmoji(dish.name)}</Text>
                </View>
                <View style={styles.dishText}>
                  <Text style={[text.bodyStrong, styles.dishName]}>{dish.name}</Text>
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
          <Section title="이 식사에 포함된 알레르기 유발 식품" index={1}>
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

function HeroStat({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: MealTheme;
}) {
  const styles = useStyles(makeStyles);

  return (
    <View style={styles.heroStat}>
      <Text style={[text.overline, { color: theme.inkMuted }]}>{label}</Text>
      <Text style={[text.bodyStrong, styles.tabular, { color: theme.ink }]}>{value}</Text>
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
      paddingHorizontal: space(6),
      paddingTop: space(16),
      paddingBottom: space(7),
      gap: space(1),
      borderBottomLeftRadius: radius.xxl,
      borderBottomRightRadius: radius.xxl,
      overflow: 'hidden',
    },
    heroBadge: {
      width: 58,
      height: 58,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: space(2),
    },
    heroEmoji: { fontSize: 30 },
    tabular: { fontVariant: ['tabular-nums'] },
    heroStats: { flexDirection: 'row', gap: space(7), marginTop: space(5) },
    heroStat: { gap: space(1) },

    section: { paddingHorizontal: space(5), gap: space(2.5) },
    sectionTitle: { color: t.colors.textSecondary },

    dishRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      paddingVertical: space(3.5),
      paddingHorizontal: space(4.5),
    },
    dishRowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.divider },
    dishIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dishEmoji: { fontSize: 17 },
    dishText: { flex: 1, gap: space(1.5) },
    dishName: { color: t.colors.text },
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
