import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { APP_SCHOOL, APP_SCHOOL_EN, APP_SCHOOL_KEY, schoolKeyOf } from '../config/school';
import { getDb } from '../config/firebase';
import type { School, UserProfile } from '../types';
import { asString, toMillis } from './firestoreUtils';

export const USERS_COLLECTION = 'users';

/** Emoji students can pick as their avatar. */
export const AVATAR_EMOJIS = [
  '🍚',
  '🍜',
  '🍛',
  '🥗',
  '🍙',
  '🍲',
  '🥟',
  '🍡',
  '🍨',
  '🍓',
  '🐰',
  '🐱',
  '🐶',
  '🦄',
] as const;

const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FRIEND_CODE_LENGTH = 6;

function randomFriendCode(): string {
  let code = '';
  for (let i = 0; i < FRIEND_CODE_LENGTH; i += 1) {
    code += FRIEND_CODE_ALPHABET[Math.floor(Math.random() * FRIEND_CODE_ALPHABET.length)];
  }
  return code;
}

/** Generates a friend code that no other profile is currently using. */
async function allocateFriendCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomFriendCode();
    const existing = await getDocs(
      query(collection(getDb(), USERS_COLLECTION), where('friendCode', '==', code), limit(1)),
    );
    if (existing.empty) return code;
  }
  // Astronomically unlikely; fall back to a longer, effectively unique code.
  return `${randomFriendCode()}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}

function readSchool(value: unknown): School | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const officeCode = asString(raw.officeCode);
  const schoolCode = asString(raw.schoolCode);
  if (!officeCode || !schoolCode) return null;

  return {
    officeCode,
    schoolCode,
    officeName: asString(raw.officeName),
    schoolName: asString(raw.schoolName),
    schoolKind: asString(raw.schoolKind),
    region: asString(raw.region),
    address: asString(raw.address),
  };
}

function readOptionalInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
}

export function toUserProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: asString(data.email),
    displayName: asString(data.displayName, '이름 없음'),
    emoji: asString(data.emoji, '🍚'),
    photoUrl: asString(data.photoUrl),
    school: readSchool(data.school),
    grade: readOptionalInt(data.grade),
    classNo: readOptionalInt(data.classNo),
    friendCode: asString(data.friendCode),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export function profileRef(uid: string) {
  return doc(getDb(), USERS_COLLECTION, uid);
}

/**
 * Reads the profile for a freshly authenticated user, creating it on first
 * sign-in. `displayNameHint` is used when the auth record has no display name
 * yet (e.g. straight after email sign-up).
 */
export async function ensureProfile(user: User, displayNameHint?: string): Promise<UserProfile> {
  const ref = profileRef(user.uid);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    const profile = toUserProfile(user.uid, snapshot.data());
    // Backfill a friend code for profiles created before codes existed.
    if (!profile.friendCode) {
      const friendCode = await allocateFriendCode();
      await updateDoc(ref, { friendCode, updatedAt: serverTimestamp() });
      return { ...profile, friendCode };
    }
    // The Google photo can appear (an email account later signs in with
    // Google) or change, and attribution should not go stale.
    const authPhoto = (user.photoURL ?? '').trim();
    if (authPhoto && authPhoto !== profile.photoUrl) {
      await updateDoc(ref, { photoUrl: authPhoto, updatedAt: serverTimestamp() });
      return { ...profile, photoUrl: authPhoto };
    }
    // Backfill VIS as the school for older profiles.
    if (!profile.school) {
      await updateDoc(ref, {
        school: APP_SCHOOL,
        schoolKey: APP_SCHOOL_KEY,
        updatedAt: serverTimestamp(),
      });
      return { ...profile, school: APP_SCHOOL };
    }
    return profile;
  }

  const friendCode = await allocateFriendCode();
  const displayName =
    (displayNameHint ?? '').trim() ||
    (user.displayName ?? '').trim() ||
    (user.email ?? '').split('@')[0] ||
    '학생';

  const now = Date.now();
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email ?? '',
    displayName,
    emoji: '🍚',
    photoUrl: (user.photoURL ?? '').trim(),
    school: APP_SCHOOL,
    grade: null,
    classNo: null,
    friendCode,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, {
    email: profile.email,
    displayName: profile.displayName,
    emoji: profile.emoji,
    photoUrl: profile.photoUrl,
    school: APP_SCHOOL,
    schoolKey: APP_SCHOOL_KEY,
    grade: null,
    classNo: null,
    friendCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return profile;
}

/** Live profile updates, so a change on one device shows up on the others. */
export function subscribeProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    profileRef(uid),
    (snapshot) => {
      onChange(snapshot.exists() ? toUserProfile(uid, snapshot.data()) : null);
    },
    onError,
  );
}

export interface ProfilePatch {
  displayName?: string;
  emoji?: string;
  grade?: number | null;
  classNo?: number | null;
}

export async function updateProfile(uid: string, patch: ProfilePatch): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.displayName !== undefined) payload.displayName = patch.displayName.trim();
  if (patch.emoji !== undefined) payload.emoji = patch.emoji;
  if (patch.grade !== undefined) payload.grade = patch.grade;
  if (patch.classNo !== undefined) payload.classNo = patch.classNo;

  await updateDoc(profileRef(uid), payload);
}

export interface SchoolSelection {
  school: School;
  grade: number | null;
  classNo: number | null;
}

export async function setProfileSchool(uid: string, selection: SchoolSelection): Promise<void> {
  await updateDoc(profileRef(uid), {
    school: selection.school,
    schoolKey: schoolKeyOf(selection.school),
    grade: selection.grade,
    classNo: selection.classNo,
    updatedAt: serverTimestamp(),
  });
}

/** Looks up the student who owns a friend code. */
export async function findProfileByFriendCode(code: string): Promise<UserProfile | null> {
  const normalized = code.trim().toUpperCase();
  if (normalized.length < 4) return null;

  const results = await getDocs(
    query(
      collection(getDb(), USERS_COLLECTION),
      where('friendCode', '==', normalized),
      limit(1),
    ),
  );

  const first = results.docs[0];
  return first ? toUserProfile(first.id, first.data()) : null;
}

/** `2학년 4반`, or an empty string when the student has not filled it in. */
export function formatClassLabel(profile: Pick<UserProfile, 'grade' | 'classNo'>): string {
  const parts: string[] = [];
  if (profile.grade !== null) parts.push(`${profile.grade}학년`);
  if (profile.classNo !== null) parts.push(`${profile.classNo}반`);
  return parts.join(' ');
}
