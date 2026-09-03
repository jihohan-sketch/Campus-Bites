import { doc, onSnapshot, query, serverTimestamp, setDoc, where, collection } from 'firebase/firestore';

import { schoolKeyOf } from '../config/school';
import { getDb } from '../config/firebase';
import type { MealType, Presence, RadarStatus, UserProfile } from '../types';
import { readMealType } from './crowd';
import { asString, chunkIds, toMillis } from './firestoreUtils';

export const PRESENCE_COLLECTION = 'presence';

/** A presence older than this is treated as "not at lunch right now". */
export const PRESENCE_TTL_MS = 90 * 60 * 1000;

const RADAR_STATUSES: RadarStatus[] = ['idle', 'heading', 'seated', 'done'];

function readStatus(value: unknown): RadarStatus {
  return RADAR_STATUSES.find((status) => status === value) ?? 'idle';
}

function toPresence(uid: string, data: Record<string, unknown>): Presence {
  return {
    uid,
    displayName: asString(data.displayName, '친구'),
    emoji: asString(data.emoji, '🍚'),
    schoolKey: asString(data.schoolKey),
    status: readStatus(data.status),
    spot: asString(data.spot),
    mealType: readMealType(data.mealType),
    updatedAt: toMillis(data.updatedAt),
  };
}

export interface PresenceUpdate {
  status: RadarStatus;
  spot: string;
  mealType: MealType;
}

/** Publishes where this student is, which is what friends see on the radar. */
export async function publishPresence(
  profile: UserProfile,
  update: PresenceUpdate,
): Promise<void> {
  await setDoc(
    doc(getDb(), PRESENCE_COLLECTION, profile.uid),
    {
      uid: profile.uid,
      displayName: profile.displayName,
      emoji: profile.emoji,
      schoolKey: profile.school ? schoolKeyOf(profile.school) : '',
      status: update.status,
      spot: update.spot.trim().slice(0, 40),
      mealType: update.mealType,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Live presence for this student's own document. */
export function subscribeMyPresence(
  uid: string,
  onChange: (presence: Presence | null) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    doc(getDb(), PRESENCE_COLLECTION, uid),
    (snapshot) => onChange(snapshot.exists() ? toPresence(uid, snapshot.data()) : null),
    onError,
  );
}

/**
 * Live presence for a set of friends.
 *
 * Firestore caps `in` filters at 30 values, so large friend lists are split
 * across several listeners whose results are merged before each callback.
 */
export function subscribeFriendPresence(
  friendUids: string[],
  onChange: (presences: Presence[]) => void,
  onError: (error: unknown) => void,
): () => void {
  if (friendUids.length === 0) {
    onChange([]);
    return () => undefined;
  }

  const chunks = chunkIds(friendUids);
  const results = new Map<number, Presence[]>();

  const emit = () => {
    const merged: Presence[] = [];
    results.forEach((chunk) => merged.push(...chunk));
    onChange(merged);
  };

  const unsubscribes = chunks.map((chunk, index) =>
    onSnapshot(
      query(collection(getDb(), PRESENCE_COLLECTION), where('uid', 'in', chunk)),
      (snapshot) => {
        results.set(
          index,
          snapshot.docs.map((entry) => toPresence(entry.id, entry.data())),
        );
        emit();
      },
      onError,
    ),
  );

  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
}

/** Whether a presence is recent enough to show on the radar. */
export function isPresenceLive(presence: Presence, now: number = Date.now()): boolean {
  return now - presence.updatedAt <= PRESENCE_TTL_MS;
}

/** The effective status: anything stale reads as `idle`. */
export function effectiveStatus(presence: Presence, now: number = Date.now()): RadarStatus {
  return isPresenceLive(presence, now) ? presence.status : 'idle';
}
