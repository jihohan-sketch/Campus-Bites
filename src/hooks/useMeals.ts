import { useCallback, useEffect, useRef, useState } from 'react';

import {
  EMPTY_MEALS,
  MEAL_CACHE_TTL_MS,
  fetchAndCacheRange,
  groupByType,
  peekDay,
  readPersistedDay,
} from '../services/mealStore';
import type { MealsByType } from '../types';
import { addDays, toYmd, type CivilDate } from '../utils/date';

export type MealsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseMealsResult {
  meals: MealsByType;
  status: MealsStatus;
  /** A message safe to show the student, or `null`. */
  error: string | null;
  /** True while showing cached data that is being refreshed behind the scenes. */
  refreshing: boolean;
  refresh: () => void;
}

/** Days fetched alongside the visible one so Today ⇄ Tomorrow never waits. */
function prefetchWindow(date: CivilDate): string[] {
  return [addDays(date, -1), date, addDays(date, 1), addDays(date, 2)].map(toYmd);
}

/**
 * Loads VIS meals for one day.
 *
 * Cached days paint immediately and are then revalidated in the background.
 */
export function useMeals(date: CivilDate): UseMealsResult {
  const ymd = toYmd(date);

  const [meals, setMeals] = useState<MealsByType>(EMPTY_MEALS);
  const [status, setStatus] = useState<MealsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  /** Guards against a slow response for a day the student already left. */
  const activeKey = useRef('');

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    const requestKey = `${ymd}:${reloadToken}`;
    activeKey.current = requestKey;

    const controller = new AbortController();
    let disposed = false;

    const apply = (next: MealsByType, nextStatus: MealsStatus) => {
      if (disposed || activeKey.current !== requestKey) return;
      setMeals(next);
      setStatus(nextStatus);
    };

    const cached = peekDay(ymd);
    const isFresh = cached !== null && Date.now() - cached.savedAt < MEAL_CACHE_TTL_MS;

    if (cached) {
      apply(groupByType(cached.meals), 'ready');
      setError(null);
      setRefreshing(!isFresh || reloadToken > 0);
    } else {
      setStatus('loading');
      setError(null);
      setRefreshing(false);
    }

    const run = async () => {
      if (!cached) {
        const persisted = await readPersistedDay(ymd);
        if (persisted) {
          apply(groupByType(persisted.meals), 'ready');
          setRefreshing(true);
        }
      }

      if (isFresh && reloadToken === 0) {
        setRefreshing(false);
        return;
      }

      try {
        const byDay = await fetchAndCacheRange(prefetchWindow(date), controller.signal);
        if (disposed || activeKey.current !== requestKey) return;
        apply(groupByType(byDay.get(ymd) ?? []), 'ready');
        setError(null);
      } catch {
        if (disposed || activeKey.current !== requestKey) return;
        setError('급식 정보를 불러오지 못했어요.');
        setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
      } finally {
        if (!disposed && activeKey.current === requestKey) setRefreshing(false);
      }
    };

    void run();

    return () => {
      disposed = true;
      controller.abort();
    };
    // `date` is derived from `ymd`, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ymd, reloadToken]);

  return { meals, status, error, refreshing, refresh };
}
