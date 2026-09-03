import { useEffect, useMemo, useState } from 'react';

import { describeAuthError } from '../config/firebase';
import { effectiveStatus, subscribeFriendPresence, subscribeMyPresence } from '../services/radar';
import type { Friend, Presence, RadarStatus } from '../types';
import { RADAR_STATUS_ORDER } from '../theme';
import { useNow } from './useNow';

/** A friend paired with their live presence, ready to render on the radar. */
export interface RadarEntry {
  friend: Friend;
  presence: Presence | null;
  status: RadarStatus;
  /** Milliseconds since their last update, or `null` when they never reported. */
  ageMs: number | null;
}

export interface UseRadarResult {
  entries: RadarEntry[];
  myPresence: Presence | null;
  /** Friends currently heading to, or sitting in, the cafeteria. */
  activeCount: number;
  loading: boolean;
  error: string | null;
  now: number;
}

/**
 * Joins the friend list with the live `presence` collection.
 *
 * Friends are ordered by how close they are to the food (seated, heading, then
 * everyone else) so the radar answers "who can I eat with right now?" first.
 */
export function useRadar(uid: string | null, friends: Friend[]): UseRadarResult {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [myPresence, setMyPresence] = useState<Presence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = useNow(15000);

  const friendUids = useMemo(
    () => friends.map((friend) => friend.uid).sort(),
    [friends],
  );
  const friendUidKey = friendUids.join(',');

  useEffect(() => {
    if (!uid) {
      setMyPresence(null);
      return;
    }
    return subscribeMyPresence(uid, setMyPresence, (subscriptionError) =>
      setError(describeAuthError(subscriptionError)),
    );
  }, [uid]);

  useEffect(() => {
    if (friendUids.length === 0) {
      setPresences([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    return subscribeFriendPresence(
      friendUids,
      (next) => {
        setPresences(next);
        setLoading(false);
      },
      (subscriptionError) => {
        setError(describeAuthError(subscriptionError));
        setLoading(false);
      },
    );
    // `friendUids` is rebuilt on every render; the joined key is the real input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendUidKey]);

  const entries = useMemo<RadarEntry[]>(() => {
    const byUid = new Map(presences.map((presence) => [presence.uid, presence]));

    return friends
      .map((friend) => {
        const presence = byUid.get(friend.uid) ?? null;
        return {
          friend,
          presence,
          status: presence ? effectiveStatus(presence, now) : ('idle' as RadarStatus),
          ageMs: presence ? now - presence.updatedAt : null,
        };
      })
      .sort((a, b) => {
        const rank =
          RADAR_STATUS_ORDER.indexOf(a.status) - RADAR_STATUS_ORDER.indexOf(b.status);
        if (rank !== 0) return rank;
        return a.friend.displayName.localeCompare(b.friend.displayName, 'ko');
      });
  }, [friends, presences, now]);

  const activeCount = useMemo(
    () => entries.filter((entry) => entry.status === 'seated' || entry.status === 'heading').length,
    [entries],
  );

  return { entries, myPresence, activeCount, loading, error, now };
}
