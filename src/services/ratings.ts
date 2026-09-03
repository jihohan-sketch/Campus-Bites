import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { isFirebaseConfigured } from '../config/env';
import { getDb } from '../config/firebase';
import type {
  MealRating,
  MealRatingSummary,
  MealTag,
  MealType,
  StarValue,
  UserProfile,
} from '../types';
import { asNumber, asString, toMillis } from './firestoreUtils';
import { readMealType } from './crowd';

export const RATINGS_COLLECTION = 'mealRatings';

/** Comments longer than this get cut; a review is a reaction, not an essay. */
export const RATING_COMMENT_LIMIT = 140;

export const MEAL_TAGS: MealTag[] = ['good', 'ok', 'bad'];

export interface MealTagTheme {
  label: string;
  emoji: string;
  color: string;
  soft: string;
}

export const mealTagTheme: Record<MealTag, MealTagTheme> = {
  good: { label: '맛있어요', emoji: '🔥', color: '#B91C1C', soft: '#FCE9E9' },
  ok: { label: '보통이에요', emoji: '😐', color: '#B45309', soft: '#FDF1DF' },
  bad: { label: '별로예요', emoji: '👎', color: '#6B635B', soft: '#F1EFEC' },
};

export function readMealTag(value: unknown): MealTag | null {
  return MEAL_TAGS.find((tag) => tag === value) ?? null;
}

function clampStars(value: unknown): StarValue {
  const rounded = Math.round(asNumber(value, 3));
  return Math.min(5, Math.max(1, rounded)) as StarValue;
}

/** `${schoolKey}_${date}_${mealType}` — the key every rating hangs off. */
export function serviceKeyOf(schoolKey: string, date: string, mealType: MealType): string {
  return `${schoolKey}_${date}_${mealType}`;
}

function ratingIdOf(serviceKey: string, raterId: string): string {
  return `${serviceKey}_${raterId}`;
}

function toMealRating(id: string, data: Record<string, unknown>): MealRating {
  return {
    id,
    schoolKey: asString(data.schoolKey),
    date: asString(data.date),
    mealType: readMealType(data.mealType),
    stars: clampStars(data.stars),
    tag: readMealTag(data.tag),
    comment: asString(data.comment),
    raterId: asString(data.raterId),
    authorName: asString(data.authorName, '익명'),
    authorEmoji: asString(data.authorEmoji, '🍚'),
    createdAt: toMillis(data.createdAt),
  };
}

/* -------------------------------------------------------------------------- */
/* Local store                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The app is guest-first, and a school may run it before anyone wires up a
 * Firebase project. Ratings then live on the device so the feature still works
 * — the UI says so, and nothing is presented as coming from other students.
 */
const LOCAL_PREFIX = 'ratings.v1';
const RATER_ID_KEY = `${LOCAL_PREFIX}:raterId`;

const localListeners = new Map<string, Set<(ratings: MealRating[]) => void>>();

function localKey(serviceKey: string): string {
  return `${LOCAL_PREFIX}:${serviceKey}`;
}

async function readLocal(serviceKey: string): Promise<MealRating[]> {
  try {
    const raw = await AsyncStorage.getItem(localKey(serviceKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) =>
      toMealRating(asString((entry as { id?: unknown }).id), entry as Record<string, unknown>),
    );
  } catch {
    return [];
  }
}

async function writeLocal(serviceKey: string, ratings: MealRating[]): Promise<void> {
  try {
    await AsyncStorage.setItem(localKey(serviceKey), JSON.stringify(ratings));
  } catch {
    // A full disk must not lose the rating the student is looking at.
  }
  localListeners.get(serviceKey)?.forEach((listener) => listener(ratings));
}

/** A stable per-device id, so a guest cannot rate the same meal twice. */
export async function getRaterId(uid: string | null): Promise<string> {
  if (uid) return uid;
  try {
    const existing = await AsyncStorage.getItem(RATER_ID_KEY);
    if (existing) return existing;
    const created = `guest_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(RATER_ID_KEY, created);
    return created;
  } catch {
    return 'guest_local';
  }
}

/** True when ratings are stored on this device instead of shared with a school. */
export const isLocalOnly = (): boolean => !isFirebaseConfigured();

/* -------------------------------------------------------------------------- */
/* Reads and writes                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Live feed of every rating for one meal service, newest first.
 *
 * Requires the composite index on (`serviceKey`, `createdAt` desc) declared in
 * `firestore.indexes.json`.
 */
export function subscribeMealRatings(
  serviceKey: string,
  onChange: (ratings: MealRating[]) => void,
  onError: (error: unknown) => void,
): () => void {
  if (isLocalOnly()) {
    const listeners = localListeners.get(serviceKey) ?? new Set();
    listeners.add(onChange);
    localListeners.set(serviceKey, listeners);

    void readLocal(serviceKey).then(onChange);

    return () => {
      listeners.delete(onChange);
      if (listeners.size === 0) localListeners.delete(serviceKey);
    };
  }

  try {
    const q = query(
      collection(getDb(), RATINGS_COLLECTION),
      where('serviceKey', '==', serviceKey),
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        onChange(snapshot.docs.map((entry) => toMealRating(entry.id, entry.data())));
      },
      onError,
    );
  } catch (error) {
    onError(error);
    return () => {};
  }
}

export interface MealRatingInput {
  schoolKey: string;
  /** `YYYYMMDD`. */
  date: string;
  mealType: MealType;
  stars: StarValue;
  tag: MealTag | null;
  comment: string;
}

/**
 * Writes the student's rating.
 *
 * The document id is derived from the rater, so submitting again replaces the
 * previous verdict instead of stuffing the ballot.
 */
export async function submitMealRating(
  input: MealRatingInput,
  rater: { raterId: string; profile: UserProfile | null },
): Promise<MealRating> {
  const serviceKey = serviceKeyOf(input.schoolKey, input.date, input.mealType);
  const id = ratingIdOf(serviceKey, rater.raterId);
  const comment = input.comment.trim().slice(0, RATING_COMMENT_LIMIT);

  const rating: MealRating = {
    id,
    schoolKey: input.schoolKey,
    date: input.date,
    mealType: input.mealType,
    stars: input.stars,
    tag: input.tag,
    comment,
    raterId: rater.raterId,
    authorName: rater.profile?.displayName ?? '익명',
    authorEmoji: rater.profile?.emoji ?? '🍚',
    createdAt: Date.now(),
  };

  if (isLocalOnly()) {
    const existing = await readLocal(serviceKey);
    const next = [rating, ...existing.filter((entry) => entry.raterId !== rater.raterId)];
    await writeLocal(serviceKey, next);
    return rating;
  }

  await setDoc(doc(getDb(), RATINGS_COLLECTION, id), {
    serviceKey,
    schoolKey: rating.schoolKey,
    date: rating.date,
    mealType: rating.mealType,
    stars: rating.stars,
    tag: rating.tag,
    comment: rating.comment,
    raterId: rating.raterId,
    authorName: rating.authorName,
    authorEmoji: rating.authorEmoji,
    createdAt: serverTimestamp(),
  });

  return rating;
}

/* -------------------------------------------------------------------------- */
/* Summaries                                                                   */
/* -------------------------------------------------------------------------- */

export const EMPTY_RATING_SUMMARY: MealRatingSummary = {
  average: null,
  count: 0,
  distribution: [0, 0, 0, 0, 0],
  topTag: null,
};

export function summarizeRatings(ratings: MealRating[]): MealRatingSummary {
  if (ratings.length === 0) return EMPTY_RATING_SUMMARY;

  const distribution: MealRatingSummary['distribution'] = [0, 0, 0, 0, 0];
  const tagCounts = new Map<MealTag, number>();
  let total = 0;

  ratings.forEach((rating) => {
    distribution[rating.stars - 1] += 1;
    total += rating.stars;
    if (rating.tag) tagCounts.set(rating.tag, (tagCounts.get(rating.tag) ?? 0) + 1);
  });

  let topTag: MealTag | null = null;
  let topCount = 0;
  tagCounts.forEach((count, tag) => {
    if (count > topCount) {
      topTag = tag;
      topCount = count;
    }
  });

  return {
    average: total / ratings.length,
    count: ratings.length,
    distribution,
    topTag,
  };
}

/**
 * Summaries for a set of past days, read once rather than through a listener —
 * history does not change while a student is looking at it.
 */
export async function fetchSummaries(
  schoolKey: string,
  days: string[],
  mealType: MealType,
): Promise<Map<string, MealRatingSummary>> {
  if (days.length === 0) return new Map();

  if (isLocalOnly()) {
    const entries = await Promise.all(
      days.map(async (date) => {
        const ratings = await readLocal(serviceKeyOf(schoolKey, date, mealType));
        return [date, summarizeRatings(ratings)] as const;
      }),
    );
    return new Map(entries);
  }

  // `in` takes at most 30 values, which is far more history than we show.
  const snapshot = await getDocs(
    query(
      collection(getDb(), RATINGS_COLLECTION),
      where('schoolKey', '==', schoolKey),
      where('mealType', '==', mealType),
      where('date', 'in', days.slice(0, 30)),
    ),
  );

  const byDay = new Map<string, MealRating[]>();
  days.forEach((date) => byDay.set(date, []));
  snapshot.docs.forEach((entry) => {
    const rating = toMealRating(entry.id, entry.data());
    byDay.get(rating.date)?.push(rating);
  });

  return new Map(
    Array.from(byDay.entries()).map(([date, ratings]) => [date, summarizeRatings(ratings)]),
  );
}
