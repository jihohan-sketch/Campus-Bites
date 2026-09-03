import { useCallback, useEffect, useMemo, useState } from 'react';

import { describeAuthError } from '../config/firebase';
import {
  EMPTY_RATING_SUMMARY,
  getRaterId,
  isLocalOnly,
  serviceKeyOf,
  submitMealRating,
  subscribeMealRatings,
  summarizeRatings,
  type MealRatingInput,
} from '../services/ratings';
import type { MealRating, MealRatingSummary, MealType, UserProfile } from '../types';

export interface UseMealRatingsResult {
  ratings: MealRating[];
  summary: MealRatingSummary;
  /** This student's existing rating for the service, or `null`. */
  mine: MealRating | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  /** True while ratings are device-local because no backend is configured. */
  localOnly: boolean;
  submit: (input: Omit<MealRatingInput, 'schoolKey' | 'date' | 'mealType'>) => Promise<boolean>;
}

/** Live ratings for one meal service, plus this student's own verdict. */
export function useMealRatings(
  schoolKey: string,
  date: string,
  mealType: MealType,
  profile: UserProfile | null,
): UseMealRatingsResult {
  const [ratings, setRatings] = useState<MealRating[]>([]);
  const [raterId, setRaterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceKey = serviceKeyOf(schoolKey, date, mealType);
  const uid = profile?.uid ?? null;

  useEffect(() => {
    let disposed = false;
    void getRaterId(uid).then((id) => {
      if (!disposed) setRaterId(id);
    });
    return () => {
      disposed = true;
    };
  }, [uid]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    return subscribeMealRatings(
      serviceKey,
      (next) => {
        setRatings(next);
        setLoading(false);
      },
      (subscriptionError) => {
        setError(describeAuthError(subscriptionError));
        setLoading(false);
      },
    );
  }, [serviceKey]);

  const summary = useMemo(() => summarizeRatings(ratings), [ratings]);

  const mine = useMemo(
    () => (raterId ? (ratings.find((rating) => rating.raterId === raterId) ?? null) : null),
    [ratings, raterId],
  );

  const submit = useCallback<UseMealRatingsResult['submit']>(
    async (input) => {
      if (!raterId) return false;

      setSubmitting(true);
      setError(null);
      try {
        await submitMealRating(
          { schoolKey, date, mealType, ...input },
          { raterId, profile },
        );
        return true;
      } catch (submitError) {
        setError(describeAuthError(submitError));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [raterId, schoolKey, date, mealType, profile],
  );

  return {
    ratings,
    summary: ratings.length === 0 ? EMPTY_RATING_SUMMARY : summary,
    mine,
    loading,
    submitting,
    error,
    localOnly: isLocalOnly(),
    submit,
  };
}
