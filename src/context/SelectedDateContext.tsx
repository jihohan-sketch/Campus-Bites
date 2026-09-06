import React, { createContext, useContext, useMemo, useState } from 'react';

import { useNow } from '../hooks/useNow';
import { currentHourInKst, daysBetween, isSameDate, todayInKst, type CivilDate } from '../utils/date';
import { currentMealType } from '../utils/meal';
import type { MealType } from '../types';

/**
 * The day the student is currently looking at.
 *
 * 급식표 and 급식실 현황 are two views of the same question — "what is being
 * served, and is it any good?" — so they have to agree on which day that is.
 * Before this, 혼잡도 read the real calendar day while 급식 let the student
 * page back and forth, and the rating card underneath ended up describing a
 * different meal from the menu on screen.
 */
export interface SelectedDateValue {
  /** The day being browsed. */
  date: CivilDate;
  setDate: (date: CivilDate) => void;
  /** The real calendar day in Korea, re-read once a minute. */
  today: CivilDate;
  isToday: boolean;
  /** Whichever service is on right now, regardless of the day being browsed. */
  currentService: MealType;
  /** The service to highlight on {@link date}, or `null` on any other day. */
  highlightedMealType: MealType | null;
  /**
   * The service the rating surfaces should describe for {@link date}: whatever
   * is being served right now on today, and lunch on any other day — that is
   * the one students actually page back to look up.
   */
  ratedMealType: MealType;
  /** False for a service that has not been served yet, so it reads only. */
  isRatable: boolean;
  /** Jumps back to the real today. */
  goToToday: () => void;
}

const SelectedDateContext = createContext<SelectedDateValue | null>(null);

export function SelectedDateProvider({ children }: { children: React.ReactNode }) {
  const [date, setDate] = useState<CivilDate>(() => todayInKst());

  // A one minute tick keeps "오늘", the highlighted service and the NOW badge
  // honest when the app is left open across a meal boundary or midnight.
  const tick = useNow(60000);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = useMemo(() => todayInKst(), [tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentService = useMemo(() => currentMealType(currentHourInKst()), [tick]);

  const value = useMemo<SelectedDateValue>(() => {
    const isToday = isSameDate(date, today);
    return {
      date,
      setDate,
      today,
      isToday,
      currentService,
      highlightedMealType: isToday ? currentService : null,
      ratedMealType: isToday ? currentService : 'lunch',
      isRatable: daysBetween(today, date) <= 0,
      goToToday: () => setDate(todayInKst()),
    };
  }, [date, today, currentService]);

  return <SelectedDateContext.Provider value={value}>{children}</SelectedDateContext.Provider>;
}

export function useSelectedDate(): SelectedDateValue {
  const context = useContext(SelectedDateContext);
  if (!context) {
    throw new Error('useSelectedDate must be used inside a SelectedDateProvider.');
  }
  return context;
}
