import type { Dish } from '../types';

/**
 * NEIS's official allergen numbering, used to expand the `(1.2.5)` suffixes
 * that appear after each dish name.
 */
export const ALLERGEN_LABELS: Record<number, string> = {
  1: '난류',
  2: '우유',
  3: '메밀',
  4: '땅콩',
  5: '대두',
  6: '밀',
  7: '고등어',
  8: '게',
  9: '새우',
  10: '돼지고기',
  11: '복숭아',
  12: '토마토',
  13: '아황산류',
  14: '호두',
  15: '닭고기',
  16: '쇠고기',
  17: '오징어',
  18: '조개류',
  19: '잣',
};

export function allergenLabel(code: number): string {
  return ALLERGEN_LABELS[code] ?? `기타(${code})`;
}

const ALLERGEN_SUFFIX = /\(([\d.\s,]+)\)\s*$/;

/**
 * Turns one menu line into a structured dish.
 *
 * A raw line looks like `*양상추샐러드&사과D(과) (1.2.5.6.12)`: a leading `*`
 * marks a recurring item, a trailing parenthesised list holds allergen codes,
 * and other parentheses are part of the dish name.
 */
export function parseDishLine(line: string): Dish {
  const trimmed = line.replace(/\s+/g, ' ').trim();
  const match = trimmed.match(ALLERGEN_SUFFIX);
  let name = trimmed;
  let allergens: number[] = [];

  if (match) {
    const codes = match[1]
      .split(/[.,\s]+/)
      .map((token) => Number(token))
      .filter((value) => Number.isInteger(value) && value > 0);
    // Only strip the suffix when it really was a list of allergen codes.
    if (codes.length > 0) {
      allergens = Array.from(new Set(codes)).sort((a, b) => a - b);
      name = trimmed.slice(0, match.index ?? trimmed.length).trim();
    }
  }

  name = name.replace(/^[*\s]+/, '').trim();
  return { name, allergens };
}

/** Every distinct allergen present across a set of dishes. */
export function collectAllergens(dishes: Dish[]): number[] {
  const codes = new Set<number>();
  dishes.forEach((dish) => dish.allergens.forEach((code) => codes.add(code)));
  return Array.from(codes).sort((a, b) => a - b);
}

/**
 * The meal service a student is most likely looking for right now, based on
 * the Korean wall clock: breakfast until 10:00, lunch until 15:00, then dinner.
 */
export function currentMealType(hour: number): 'breakfast' | 'lunch' | 'dinner' {
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  return 'dinner';
}
