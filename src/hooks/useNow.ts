import { useEffect, useState } from 'react';

/**
 * A clock that re-renders on an interval, so relative labels like "3분 전" and
 * freshness indicators stay honest without every screen owning a timer.
 */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
