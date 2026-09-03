import { Timestamp } from 'firebase/firestore';

/**
 * Firestore timestamps arrive as `Timestamp` instances, but a document read
 * back from the local cache immediately after a write with `serverTimestamp()`
 * momentarily holds `null`. This normalises every shape to epoch milliseconds.
 */
export function toMillis(value: unknown, fallback: number = Date.now()): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds: unknown }).seconds === 'number'
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }
  return fallback;
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Splits ids into chunks of 30, the maximum size of a Firestore `in` filter. */
export function chunkIds<T>(ids: T[], size = 30): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
}
