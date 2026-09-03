import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { schoolKeyOf } from '../config/school';
import { getDb } from '../config/firebase';
import type { Friend, FriendRequest, UserProfile } from '../types';
import { asString, toMillis } from './firestoreUtils';
import { toUserProfile, USERS_COLLECTION } from './profile';

export const FRIEND_REQUESTS_COLLECTION = 'friendRequests';
const FRIENDS_SUBCOLLECTION = 'friends';

/** Raised for the expected, user-facing failures of the invite flow. */
export class FriendActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendActionError';
  }
}

function friendsCollection(uid: string) {
  return collection(getDb(), USERS_COLLECTION, uid, FRIENDS_SUBCOLLECTION);
}

function friendDoc(ownerUid: string, friendUid: string) {
  return doc(getDb(), USERS_COLLECTION, ownerUid, FRIENDS_SUBCOLLECTION, friendUid);
}

function requestId(fromUid: string, toUid: string): string {
  return `${fromUid}__${toUid}`;
}

function toFriend(uid: string, data: Record<string, unknown>): Friend {
  return {
    uid,
    displayName: asString(data.displayName, '친구'),
    emoji: asString(data.emoji, '🍚'),
    schoolKey: asString(data.schoolKey),
    schoolName: asString(data.schoolName),
    since: toMillis(data.since),
  };
}

function toFriendRequest(id: string, data: Record<string, unknown>): FriendRequest {
  return {
    id,
    fromUid: asString(data.fromUid),
    fromName: asString(data.fromName, '학생'),
    fromEmoji: asString(data.fromEmoji, '🍚'),
    fromSchoolName: asString(data.fromSchoolName),
    toUid: asString(data.toUid),
    createdAt: toMillis(data.createdAt),
  };
}

/** The payload mirrored into a friend list entry. */
function friendPayload(profile: UserProfile) {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    emoji: profile.emoji,
    schoolKey: profile.school ? schoolKeyOf(profile.school) : '',
    schoolName: profile.school?.schoolName ?? '',
    since: serverTimestamp(),
  };
}

export function subscribeFriends(
  uid: string,
  onChange: (friends: Friend[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    friendsCollection(uid),
    (snapshot) => {
      const friends = snapshot.docs
        .map((entry) => toFriend(entry.id, entry.data()))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'));
      onChange(friends);
    },
    onError,
  );
}

/**
 * Live list of invites waiting for this student.
 *
 * Requires the composite index on (`toUid`, `createdAt` desc) declared in
 * `firestore.indexes.json`.
 */
export function subscribeIncomingRequests(
  uid: string,
  onChange: (requests: FriendRequest[]) => void,
  onError: (error: unknown) => void,
): () => void {
  const q = query(
    collection(getDb(), FRIEND_REQUESTS_COLLECTION),
    where('toUid', '==', uid),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((entry) => toFriendRequest(entry.id, entry.data())));
    },
    onError,
  );
}

/** Invites sent by this student that have not been answered yet. */
export function subscribeOutgoingRequests(
  uid: string,
  onChange: (requests: FriendRequest[]) => void,
  onError: (error: unknown) => void,
): () => void {
  const q = query(
    collection(getDb(), FRIEND_REQUESTS_COLLECTION),
    where('fromUid', '==', uid),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((entry) => toFriendRequest(entry.id, entry.data())));
    },
    onError,
  );
}

/**
 * Sends an invite to the owner of `friendCode`.
 *
 * If that student has already invited *us*, the two invites are collapsed into
 * an immediate friendship rather than leaving both sides waiting.
 */
export async function sendFriendRequest(
  me: UserProfile,
  target: UserProfile,
): Promise<'sent' | 'accepted'> {
  if (target.uid === me.uid) {
    throw new FriendActionError('본인은 친구로 추가할 수 없어요.');
  }

  const alreadyFriends = await getDoc(friendDoc(me.uid, target.uid));
  if (alreadyFriends.exists()) {
    throw new FriendActionError(`${target.displayName}님과 이미 친구예요.`);
  }

  const reciprocal = await getDoc(
    doc(getDb(), FRIEND_REQUESTS_COLLECTION, requestId(target.uid, me.uid)),
  );
  if (reciprocal.exists()) {
    await acceptFriendRequest(me, toFriendRequest(reciprocal.id, reciprocal.data()), target);
    return 'accepted';
  }

  const existing = await getDoc(
    doc(getDb(), FRIEND_REQUESTS_COLLECTION, requestId(me.uid, target.uid)),
  );
  if (existing.exists()) {
    throw new FriendActionError('이미 친구 요청을 보냈어요. 수락을 기다려 주세요.');
  }

  await setDoc(doc(getDb(), FRIEND_REQUESTS_COLLECTION, requestId(me.uid, target.uid)), {
    fromUid: me.uid,
    fromName: me.displayName,
    fromEmoji: me.emoji,
    fromSchoolName: me.school?.schoolName ?? '',
    toUid: target.uid,
    createdAt: serverTimestamp(),
  });

  return 'sent';
}

/**
 * Accepts an invite, writing the mirrored friend entry on both sides and
 * clearing the request in one batch so the operation is all-or-nothing.
 */
export async function acceptFriendRequest(
  me: UserProfile,
  request: FriendRequest,
  senderProfile?: UserProfile,
): Promise<void> {
  let sender = senderProfile;

  if (!sender) {
    const snapshot = await getDoc(doc(getDb(), USERS_COLLECTION, request.fromUid));
    if (!snapshot.exists()) {
      throw new FriendActionError('요청을 보낸 학생을 찾을 수 없어요.');
    }
    sender = toUserProfile(snapshot.id, snapshot.data());
  }

  const batch = writeBatch(getDb());
  batch.set(friendDoc(me.uid, sender.uid), friendPayload(sender));
  batch.set(friendDoc(sender.uid, me.uid), friendPayload(me));
  batch.delete(doc(getDb(), FRIEND_REQUESTS_COLLECTION, request.id));

  await batch.commit();
}

export async function declineFriendRequest(request: FriendRequest): Promise<void> {
  await deleteDoc(doc(getDb(), FRIEND_REQUESTS_COLLECTION, request.id));
}

export async function cancelFriendRequest(request: FriendRequest): Promise<void> {
  await deleteDoc(doc(getDb(), FRIEND_REQUESTS_COLLECTION, request.id));
}

export async function removeFriend(uid: string, friendUid: string): Promise<void> {
  const batch = writeBatch(getDb());
  batch.delete(friendDoc(uid, friendUid));
  batch.delete(friendDoc(friendUid, uid));
  await batch.commit();
}

/**
 * Pushes the current display name / emoji / school onto every friend list this
 * student appears in, so friends never see a stale name.
 */
export async function syncFriendMirrors(profile: UserProfile): Promise<void> {
  const friends = await getDocs(friendsCollection(profile.uid));
  if (friends.empty) return;

  const batch = writeBatch(getDb());
  friends.docs.forEach((entry) => {
    batch.set(
      friendDoc(entry.id, profile.uid),
      {
        uid: profile.uid,
        displayName: profile.displayName,
        emoji: profile.emoji,
        schoolKey: profile.school ? schoolKeyOf(profile.school) : '',
        schoolName: profile.school?.schoolName ?? '',
      },
      { merge: true },
    );
  });

  await batch.commit();
}
