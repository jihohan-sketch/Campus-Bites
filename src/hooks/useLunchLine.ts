import { useEffect, useState } from 'react';

import { simulateLunchLine, type LunchLineSnapshot } from '../services/lunchLine';
import type { Minutes } from '../config/lunchRush';

export interface UseLunchLineOptions {
  /**
   * How often a fresh reading is taken. Short enough that "마지막 업데이트"
   * visibly moves, long enough that the card is not doing work every frame.
   */
  refreshMs?: number;
  /** Freezes the position in the service window; used for previews. */
  nowMinutes?: Minutes;
  /** Stops the ticker without unmounting — e.g. when viewing another day. */
  active?: boolean;
}

/**
 * The current lunch queue reading, refreshed on an interval.
 *
 * This is the single seam between the UI and the data. Swapping the simulation
 * for a realtime backend means replacing the interval below with a
 * subscription that pushes `LunchLineSnapshot`s; nothing above it changes.
 */
export function useLunchLine({
  refreshMs = 15000,
  nowMinutes,
  active = true,
}: UseLunchLineOptions = {}): LunchLineSnapshot {
  const [snapshot, setSnapshot] = useState<LunchLineSnapshot>(() =>
    simulateLunchLine(Date.now(), nowMinutes),
  );

  useEffect(() => {
    const read = () => setSnapshot(simulateLunchLine(Date.now(), nowMinutes));

    // Re-read immediately so a remount, a day change or waking from the
    // background never shows a stale reading while waiting for the first tick.
    read();
    if (!active) return;

    const timer = setInterval(read, refreshMs);
    return () => clearInterval(timer);
  }, [refreshMs, nowMinutes, active]);

  return snapshot;
}
