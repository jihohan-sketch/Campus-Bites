import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { getDb } from '../config/firebase';
import { MEAL_TYPES } from '../types';
import type { CrowdLevel, CrowdReport, CrowdSummary, MealType, UserProfile } from '../types';
import { asNumber, asString, toMillis } from './firestoreUtils';

/** Narrows an untrusted stored value to a known meal type. */
export function readMealType(value: unknown, fallback: MealType = 'lunch'): MealType {
  return MEAL_TYPES.find((type) => type === value) ?? fallback;
}

export const CROWD_COLLECTION = 'crowdReports';

/** Reports older than this no longer describe the queue you are about to join. */
export const CROWD_WINDOW_MS = 45 * 60 * 1000;

/** How many recent reports to keep in the live listener. */
const CROWD_LISTEN_LIMIT = 60;

function toCrowdReport(id: string, data: Record<string, unknown>): CrowdReport {
  const level = Math.min(5, Math.max(1, Math.round(asNumber(data.level, 3)))) as CrowdLevel;
  return {
    id,
    schoolKey: asString(data.schoolKey),
    mealType: readMealType(data.mealType),
    level,
    waitMinutes: Math.max(0, Math.round(asNumber(data.waitMinutes, 0))),
    note: asString(data.note),
    authorUid: asString(data.authorUid),
    authorName: asString(data.authorName, '익명'),
    authorEmoji: asString(data.authorEmoji, '🍚'),
    authorPhotoUrl: asString(data.authorPhotoUrl),
    createdAt: toMillis(data.createdAt),
  };
}

/**
 * Live feed of crowd reports for one school, newest first.
 *
 * Requires the composite index on (`schoolKey`, `createdAt` desc) declared in
 * `firestore.indexes.json`.
 */
export function subscribeCrowdReports(
  schoolKey: string,
  onChange: (reports: CrowdReport[]) => void,
  onError: (error: unknown) => void,
): () => void {
  const q = query(
    collection(getDb(), CROWD_COLLECTION),
    where('schoolKey', '==', schoolKey),
    orderBy('createdAt', 'desc'),
    limit(CROWD_LISTEN_LIMIT),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((entry) => toCrowdReport(entry.id, entry.data())));
    },
    onError,
  );
}

export interface CrowdReportInput {
  level: CrowdLevel;
  waitMinutes: number;
  note: string;
  mealType: MealType;
}

export async function submitCrowdReport(
  profile: UserProfile,
  schoolKey: string,
  input: CrowdReportInput,
): Promise<void> {
  await addDoc(collection(getDb(), CROWD_COLLECTION), {
    schoolKey,
    mealType: input.mealType,
    level: input.level,
    waitMinutes: Math.max(0, Math.round(input.waitMinutes)),
    note: input.note.trim().slice(0, 120),
    authorUid: profile.uid,
    authorName: profile.displayName,
    authorEmoji: profile.emoji,
    // Denormalised so the feed renders without a read per author.
    authorPhotoUrl: profile.photoUrl,
    createdAt: serverTimestamp(),
  });
}

const EMPTY_SUMMARY: CrowdSummary = {
  level: null,
  waitMinutes: null,
  reportCount: 0,
  freshnessMs: null,
  trend: 'unknown',
};

function mean(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * Rolls the recent reports up into a single reading.
 *
 * The trend compares the newest third of the window against the oldest third,
 * which is enough to tell a student whether the line is building or clearing.
 */
export function summarizeCrowd(
  reports: CrowdReport[],
  now: number = Date.now(),
  windowMs: number = CROWD_WINDOW_MS,
): CrowdSummary {
  const recent = reports
    .filter((report) => now - report.createdAt <= windowMs)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (recent.length === 0) return EMPTY_SUMMARY;

  const levels = recent.map((report) => report.level);
  const waits = recent.map((report) => report.waitMinutes).filter((value) => value > 0);

  let trend: CrowdSummary['trend'] = 'unknown';
  if (recent.length >= 4) {
    const third = Math.max(1, Math.floor(recent.length / 3));
    const newest = mean(levels.slice(0, third));
    const oldest = mean(levels.slice(-third));
    const delta = newest - oldest;
    if (delta >= 0.5) trend = 'rising';
    else if (delta <= -0.5) trend = 'falling';
    else trend = 'steady';
  } else if (recent.length >= 2) {
    trend = 'steady';
  }

  return {
    level: mean(levels),
    waitMinutes: waits.length > 0 ? Math.round(mean(waits)) : null,
    reportCount: recent.length,
    freshnessMs: now - recent[0].createdAt,
    trend,
  };
}

export const CROWD_TREND_LABEL: Record<CrowdSummary['trend'], string> = {
  rising: '점점 붐비는 중',
  falling: '빠지는 중',
  steady: '변화 없음',
  unknown: '추세 분석 중',
};
