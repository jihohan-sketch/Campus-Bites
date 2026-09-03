import { collection, getDocs, query, where } from 'firebase/firestore';

import { isFirebaseConfigured } from '../config/env';
import { getDb } from '../config/firebase';
import { APP_SCHOOL_KEY, toMeal } from '../config/school';
import { MEAL_TYPES, type Meal, type MealType } from '../types';

/**
 * Menus published to Firestore.
 *
 * The bundled 식단표 in `config/school.ts` is the offline baseline; this
 * collection lets the school post a new month without shipping a build. A
 * remote day wins over the bundled one for the same date.
 *
 * Documents live at `menus/{schoolKey}_{YYYYMMDD}` and are world readable —
 * the 급식표 is the one screen that must work for a signed-out student.
 */
export const MENUS_COLLECTION = 'menus';

/** Firestore caps `in` filters at 30 values, which covers our prefetch window. */
const MAX_DATES_PER_QUERY = 30;

function readDishes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Reads published menus for `ymds`, newest wins.
 *
 * Returns an empty map when Firebase is not configured or the read fails, so
 * the caller silently falls back to the bundled menu.
 */
export async function fetchRemoteMenus(
  ymds: string[],
  schoolKey: string = APP_SCHOOL_KEY,
): Promise<Map<string, Meal[]>> {
  const byDay = new Map<string, Meal[]>();
  if (ymds.length === 0 || !isFirebaseConfigured()) return byDay;

  try {
    const snapshot = await getDocs(
      query(
        collection(getDb(), MENUS_COLLECTION),
        where('schoolKey', '==', schoolKey),
        where('date', 'in', ymds.slice(0, MAX_DATES_PER_QUERY)),
      ),
    );

    snapshot.docs.forEach((entry) => {
      const data = entry.data() as Record<string, unknown>;
      const date = typeof data.date === 'string' ? data.date : '';
      if (!date) return;

      const meals: Meal[] = [];
      MEAL_TYPES.forEach((mealType: MealType) => {
        const dishes = readDishes(data[mealType]);
        if (dishes.length > 0) meals.push(toMeal(date, mealType, dishes));
      });

      // An explicitly published day with no dishes still counts: it means the
      // school posted "no meal today", which is different from "not published".
      byDay.set(date, meals);
    });
  } catch {
    // A menu server that is down must not blank out the bundled 식단표.
    return new Map();
  }

  return byDay;
}
