import { useEffect, useState } from 'react';

import { describeAuthError } from '../config/firebase';
import {
  subscribeFriends,
  subscribeIncomingRequests,
  subscribeOutgoingRequests,
} from '../services/friends';
import type { Friend, FriendRequest } from '../types';

export interface UseFriendsResult {
  friends: Friend[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  loading: boolean;
  error: string | null;
}

/** Live friend list plus both directions of pending invites. */
export function useFriends(uid: string | null): UseFriendsResult {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const onError = (subscriptionError: unknown) => {
      setError(describeAuthError(subscriptionError));
      setLoading(false);
    };

    const unsubscribeFriends = subscribeFriends(
      uid,
      (next) => {
        setFriends(next);
        setLoading(false);
      },
      onError,
    );
    const unsubscribeIncoming = subscribeIncomingRequests(uid, setIncoming, onError);
    const unsubscribeOutgoing = subscribeOutgoingRequests(uid, setOutgoing, onError);

    return () => {
      unsubscribeFriends();
      unsubscribeIncoming();
      unsubscribeOutgoing();
    };
  }, [uid]);

  return { friends, incoming, outgoing, loading, error };
}
