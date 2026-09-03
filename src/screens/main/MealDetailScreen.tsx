import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { Screen } from '../../components/Screen';
import type { RootStackParamList } from '../../navigation/types';
import { colors, mealTheme, radius, space, type } from '../../theme';
import { fromYmd, formatLongKoreanDate } from '../../utils/date';
import { allergenLabel, collectAllergens } from '../../utils/meal';

type Props = NativeStackScreenProps<RootStackParamList, 'MealDetail'>;

export function MealDetailScreen({ route }: Props) {
  const { meal } = route.params;
  const theme = mealTheme[meal.type];
  const civilDate = useMemo(() => fromYmd(meal.date), [meal.date]);
  const allergens = useMemo(() => collectAllergens(meal.dishes), [meal.dishes]);

  return (
    <Screen topInset={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>{theme.emoji}</Text>
          <Text style={[type.title, styles.heroTitle]}>{theme.label}</Text>
          <Text style={[type.caption, styles.heroMeta]}>
            {civilDate ? formatLongKoreanDate(civilDate) : meal.date} · {theme.window}
          </Text>

          <View style={styles.heroStats}>
            {meal.calories !== null ? (
              <HeroStat label="열량" value={`${Math.round(meal.calories)} kcal`} />
            ) : null}
            {meal.headcount !== null ? (
              <HeroStat label="식수 인원" value={`${meal.headcount.toLocaleString('ko-KR')}명`} />
            ) : null}
            <HeroStat label="메뉴" value={`${meal.dishes.length}가지`} />
          </View>
        </LinearGradient>

        <Section title="오늘의 메뉴">
          <Card>
            {meal.dishes.map((dish, index) => (
              <View
                key={`${dish.name}-${index}`}
                style={[styles.dishRow, index > 0 ? styles.dishRowDivided : null]}
              >
                <Text style={[type.body, styles.dishName]}>{dish.name}</Text>
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
            ))}
          </Card>
        </Section>

        {allergens.length > 0 ? (
          <Section title="이 식사에 포함된 알레르기 유발 식품">
            <View style={styles.allergenWrap}>
              {allergens.map((code) => (
                <Pill key={code} label={`${code}. ${allergenLabel(code)}`} />
              ))}
            </View>
          </Section>
        ) : null}

        {meal.nutrition.length > 0 ? (
          <Section title="영양 정보">
            <Card>
              {meal.nutrition.map((pair, index) => (
                <InfoRow
                  key={pair.label}
                  label={pair.label}
                  value={pair.value}
                  divided={index > 0}
                />
              ))}
            </Card>
          </Section>
        ) : null}

        {meal.origins.length > 0 ? (
          <Section title="원산지">
            <Card>
              {meal.origins.map((pair, index) => (
                <InfoRow
                  key={pair.label}
                  label={pair.label}
                  value={pair.value}
                  divided={index > 0}
                />
              ))}
            </Card>
          </Section>
        ) : null}

        <Text style={[type.caption, styles.source]}>
          자료 출처: 교육부 나이스(NEIS) 급식식단정보 · {meal.schoolName}
        </Text>
      </ScrollView>
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={[type.caption, styles.heroStatLabel]}>{label}</Text>
      <Text style={[type.bodyStrong, styles.heroStatValue]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[type.label, styles.sectionTitle]}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  divided,
}: {
  label: string;
  value: string;
  divided: boolean;
}) {
  return (
    <View style={[styles.infoRow, divided ? styles.infoRowDivided : null]}>
      <Text style={[type.body, styles.infoLabel]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[type.bodyStrong, styles.infoValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: space(12), gap: space(5) },
  hero: { padding: space(6), paddingTop: space(8), gap: space(1) },
  heroEmoji: { fontSize: 34 },
  heroTitle: { color: colors.white },
  heroMeta: { color: 'rgba(255,255,255,0.88)' },
  heroStats: { flexDirection: 'row', gap: space(6), marginTop: space(4) },
  heroStat: { gap: space(0.5) },
  heroStatLabel: { color: 'rgba(255,255,255,0.8)' },
  heroStatValue: { color: colors.white },
  section: { paddingHorizontal: space(5), gap: space(2.5) },
  sectionTitle: { color: colors.textSecondary },
  dishRow: { paddingVertical: space(3), gap: space(2) },
  dishRowDivided: { borderTopWidth: 1, borderTopColor: colors.border },
  dishName: { color: colors.text },
  dishAllergens: { flexDirection: 'row', flexWrap: 'wrap', gap: space(1.5) },
  allergenWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space(2),
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space(4),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space(4),
    paddingVertical: space(2.5),
  },
  infoRowDivided: { borderTopWidth: 1, borderTopColor: colors.border },
  infoLabel: { color: colors.textSecondary, flex: 1 },
  infoValue: { color: colors.text, textAlign: 'right' },
  source: {
    color: colors.textMuted,
    paddingHorizontal: space(5),
    marginTop: space(2),
  },
});
