/**
 * Date helpers for the app.
 *
 * NEIS publishes every meal against a Korean calendar date, and students read
 * the app on Korean time, so all "today" logic is anchored to KST. Korea has no
 * daylight saving, so a fixed UTC+9 offset is exact and avoids depending on the
 * device time zone or on Intl being available in the JS engine.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A calendar date with no time or zone attached. */
export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** Today's date in Korea. */
export function todayInKst(): CivilDate {
  return fromUtcMillis(Date.now() + KST_OFFSET_MS);
}

/** The current wall clock hour in Korea (0–23). */
export function currentHourInKst(): number {
  return new Date(Date.now() + KST_OFFSET_MS).getUTCHours();
}

/** Minutes since midnight in Korea (0–1439). */
export function currentMinutesInKst(): number {
  const d = new Date(Date.now() + KST_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function fromUtcMillis(millis: number): CivilDate {
  const d = new Date(millis);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function toUtcMillis(date: CivilDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

/** Returns a new date `amount` days after `date` (negative moves backwards). */
export function addDays(date: CivilDate, amount: number): CivilDate {
  return fromUtcMillis(toUtcMillis(date) + amount * DAY_MS);
}

/** Whole days from `a` to `b`. */
export function daysBetween(a: CivilDate, b: CivilDate): number {
  return Math.round((toUtcMillis(b) - toUtcMillis(a)) / DAY_MS);
}

export function isSameDate(a: CivilDate, b: CivilDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** `YYYYMMDD`, the format every NEIS date parameter expects. */
export function toYmd(date: CivilDate): string {
  return `${date.year}${pad(date.month)}${pad(date.day)}`;
}

/** Parses `YYYYMMDD`; returns `null` for anything malformed. */
export function fromYmd(ymd: string): CivilDate | null {
  if (!/^\d{8}$/.test(ymd)) return null;
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(4, 6));
  const day = Number(ymd.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayIndex(date: CivilDate): number {
  return new Date(toUtcMillis(date)).getUTCDay();
}

export function weekdayName(date: CivilDate): string {
  return WEEKDAY_NAMES[weekdayIndex(date)];
}

export function isWeekend(date: CivilDate): boolean {
  const day = weekdayIndex(date);
  return day === 0 || day === 6;
}

/** `9월 1일 (월)`. */
export function formatKoreanDate(date: CivilDate): string {
  return `${date.month}월 ${date.day}일 (${weekdayName(date)})`;
}

/** `2026년 9월 1일 월요일`. */
export function formatLongKoreanDate(date: CivilDate): string {
  return `${date.year}년 ${date.month}월 ${date.day}일 ${weekdayName(date)}요일`;
}

/** `오늘` / `내일` / `어제` / `모레`, falling back to a weekday name. */
export function relativeDayLabel(date: CivilDate, reference: CivilDate = todayInKst()): string {
  switch (daysBetween(reference, date)) {
    case 0:
      return '오늘';
    case 1:
      return '내일';
    case 2:
      return '모레';
    case -1:
      return '어제';
    case -2:
      return '그저께';
    default:
      return `${weekdayName(date)}요일`;
  }
}

/** `방금`, `5분 전`, `2시간 전`, or a date for anything older than a week. */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatKoreanDate(fromUtcMillis(timestamp + KST_OFFSET_MS));
}

/** `12:24`, in Korean local time. */
export function formatKstClock(timestamp: number): string {
  const d = new Date(timestamp + KST_OFFSET_MS);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
