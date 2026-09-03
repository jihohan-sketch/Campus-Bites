import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchMealsInRange, schoolKeyOf } from '../config/school';
import type { Meal, MealsByType } from '../types';

/**
 * Two layer cache for VIS menus: a synchronous in-memory map that keeps day
 * switching instant, backed by AsyncStorage so yesterday's menu still renders
 * when the cafeteria wifi is down.
 */

interface CachedDay {
  savedAt: number;
  meals: Meal[];
}

const memory = new Map<string, CachedDay>();

/** Menus change rarely; a day older than this is refetched in the background. */
export const MEAL_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const STORAGE_PREFIX = 'meals.v1';

function cacheKey(ymd: string): string {
  return `${schoolKeyOf()}:${ymd}`;
}

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}:${key}`;
}

export const EMPTY_MEALS: MealsByType = { breakfast: null, lunch: null, dinner: null };

/** Groups a flat list of meals into the breakfast/lunch/dinner triple. */
export function groupByType(meals: Meal[]): MealsByType {
  const grouped: MealsByType = { ...EMPTY_MEALS };
  meals.forEach((meal) => {
    grouped[meal.type] = meal;
  });
  return grouped;
}

/** Synchronous cache probe used to paint the screen before any await. */
export function peekDay(ymd: string): CachedDay | null {
  return memory.get(cacheKey(ymd)) ?? null;
}

/** Reads a day from AsyncStorage and promotes it into the memory cache. */
export async function readPersistedDay(ymd: string): Promise<CachedDay | null> {
  const key = cacheKey(ymd);
  const cached = memory.get(key);
  if (cached) return cached;

  try {
    const raw = await AsyncStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedDay;
    if (!Array.isArray(parsed.meals)) return null;
    memory.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function writeDay(ymd: string, meals: Meal[]): Promise<void> {
  const key = cacheKey(ymd);
  const entry: CachedDay = { savedAt: Date.now(), meals };
  memory.set(key, entry);
  try {
    await AsyncStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // A full disk must not break the screen; the memory cache still serves.
  }
}

/**
 * Loads a date range from the local VIS menu and caches each day, including
 * days with no meals so "급식 없음" is answered instantly next time.
 */
export async function fetchAndCacheRange(
  ymds: string[],
  _signal?: AbortSignal,
): Promise<Map<string, Meal[]>> {
  if (ymds.length === 0) return new Map();

  const sorted = [...ymds].sort();
  const meals = fetchMealsInRange(sorted[0], sorted[sorted.length - 1]);

  const byDay = new Map<string, Meal[]>();
  sorted.forEach((ymd) => byDay.set(ymd, []));
  meals.forEach((meal) => {
    const bucket = byDay.get(meal.date);
    if (bucket) bucket.push(meal);
    else byDay.set(meal.date, [meal]);
  });

  await Promise.all(
    Array.from(byDay.entries()).map(([ymd, dayMeals]) => writeDay(ymd, dayMeals)),
  );

  return byDay;
}

/** Drops every cached day. */
export async function clearMealCache(): Promise<void> {
  memory.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
    if (ours.length > 0) await AsyncStorage.removeMany(ours);
  } catch {
    // Cache eviction is best effort.
  }
}