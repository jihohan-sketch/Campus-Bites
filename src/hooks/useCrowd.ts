import { useEffect, useMemo, useState } from 'react';

import { isFirebaseConfigured } from '../config/env';
import { describeAuthError } from '../config/firebase';
import { subscribeCrowdReports, summarizeCrowd } from '../services/crowd';
import type { CrowdReport, CrowdSummary } from '../types';
import { useNow } from './useNow';

export interface UseCrowdResult {
  reports: CrowdReport[];
  summary: CrowdSummary;
  loading: boolean;
  error: string | null;
  /** Shared clock, so callers can format relative times consistently. */
  now: number;
}

/** Live cafeteria crowd feed and rolled-up reading for one school. */
export function useCrowd(schoolKey: string | null): UseCrowdResult {
  const [reports, setReports] = useState<CrowdReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = useNow(20000);

  useEffect(() => {
    if (!schoolKey) {
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Guest-first: 급식표 must render with no backend, so an unconfigured
    // project leaves the crowd feed empty instead of tearing down the screen.
    if (!isFirebaseConfigured()) {
      setReports([]);
      setLoading(false);
      return;
    }

    try {
      return subscribeCrowdReports(
        schoolKey,
        (next) => {
          setReports(next);
          setLoading(false);
        },
        (subscriptionError) => {
          setError(describeAuthError(subscriptionError));
          setLoading(false);
        },
      );
    } catch (subscriptionError) {
      setError(describeAuthError(subscriptionError));
      setLoading(false);
      return;
    }
  }, [schoolKey]);

  const summary = useMemo(() => summarizeCrowd(reports, now), [reports, now]);

  return { reports, summary, loading, error, now };
}
